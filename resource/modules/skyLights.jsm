Modules.VERSION = '1.1.0';

// this is the part for interaction by other possible add-ons or elements that will add/control other sky lights
this.skyLights = {
	get container () { return $(objName+'-skyLights-container'); },
	
	lights: new Map(),
	
	handleEvent: function(e) {
		switch(e.type) {
			case 'click':
				if(e.defaultPrevented) { return; }
				
				if(e.target._action) {
					e.target._action(e);
				} else if(e.target.parentNode._action) {
					e.target.parentNode._action(e);
				}
				break;
			
			case 'WillShowSlimChrome':
				var node = e.detail.target;
				if(isAncestor(node, this.container)) {
					while(node) {
						if(node == this.container) { return; }
						
						if(node.className == 'skyLight') {
							e.preventDefault();
							e.stopPropagation();
							return;
						}
						
						node = node.parentNode;
					}
				}
				break;
		}
	},
	
	observe: function(aSubject, aTopic, aData) {
		switch(aSubject) {
			case 'skyLightsHide':
				this.hideOnChrome();
				breaK;
		}
	},
	
	update: function(name, props) {
		if(typeof(name) != 'string') { return; }
		
		var light = this.get(name);
		
		if(!light) {
			// in case something calls this too soon
			if(!this.container) { return; }
			
			light = document.createElement('box');
			light.id = objName+'-skyLights-'+name;
			setAttribute(light, 'class', 'skyLight');
			setAttribute(light, 'context', 'toolbar-context-menu');
			
			light._action = null;
			Listeners.add(light, 'click', this);
			
			light.appendChild(document.createElement('box'));
			setAttribute(light.firstChild, 'class', 'skyLightArea');
			Listeners.add(light.firstChild, 'click', this);
			
			this.container.appendChild(light);
			this.lights.set(name, light);
		}
		
		for(let p in props) {
			switch(p) {
				// state is an identifying string, mostly for convenience to quickly and easily retrieve the current state of the light
				case 'state':
					setAttribute(light, 'state', props[p]);
					break;
				
				// color is simply a color (rgb/a, hsl/a, hex string, color code) that will be applied to the light
				case 'color':
					light.style.backgroundColor = props[p];
					
					var isTransparent = props[p] == 'transparent';
					if(!isTransparent) {
						var colorExplode = props[p].split(',');
						if(colorExplode.length == 4) {
							isTransparent = parseInt(colorExplode[3]) == 0;
						}
					}
					
					var sscode = '/*The Fox, Only Better CSS declarations of variable values*/\n';
					sscode += '@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);\n';
					sscode += '@-moz-document url("'+document.baseURI+'") {\n';
					sscode += '	window['+objName+'_UUID="'+_UUID+'"] #theFoxOnlyBetter-skyLights-'+name+':-moz-any(:hover,[active],[alert="on"]) {\n';
					
					if(isTransparent) {
						sscode += '	box-shadow: rgba(0,0,0,0.2) 0 1px 2px;\n';
					} else {
						sscode += '	box-shadow: rgba(0,0,0,0.2) 0 1px 2px 1px, '+props[p]+' 3px 0 4px, '+props[p]+' -3px 0 4px, '+props[p]+' 0 0px 11px;\n';
					}
					
					sscode += '	}\n';
					sscode += '}';
					
					Styles.load('skyLight-'+name+'_'+_UUID, sscode, true);
					toggleAttribute(light, 'transparent', isTransparent);
					
					break;
				
				// tooltip is the text that should appear when the mouse is hovered to the light
				case 'tooltip':
					setAttribute(light, 'tooltiptext', props[p]);
					break;
				
				// context defines which context menu should the light use if it is right-clicked; by default it will use the toolbar context menu
				case 'context':
					setAttribute(light, 'context', props[p]);
					break;
				
				// action is the method to be called when the user clicks the sky light
				case 'action':
					light._action = props[p];
					toggleAttribute(light, 'action', props[p]);
					break;
					
				// active will set an active attribute to the light, making it always "on" as if the mouse was over it
				case 'active':
					toggleAttribute(light, 'active', props[p]);
					break;
				
				// alert will blink the light until the user hovers it with the mouse
				case 'alert':
					if(light._alert) {
						light._alert();
					}
					
					if(props[p]) {
						light._alert = function() {
							Timers.cancel('skyLightsAlert-'+name);
							Listeners.remove(this, 'mouseover', this._alert);
							delete this._alert;
							removeAttribute(this, 'alert');
						};
						
						Listeners.add(light, 'mouseover', light._alert);
						Timers.init('skyLightsAlert-'+name, function() {
							setAttribute(light, 'alert', (light.getAttribute('alert') == 'on') ? 'off' : 'on');
						}, 500, 'slack');
					}
					break;
				
				default: break;
			}
		}
	},
	
	get: function(name) {
		if(typeof(name) != 'string') { return; }
		
		return this.lights.get(name);
	},
	
	remove: function(name) {
		if(typeof(name) != 'string') { return; }
		
		if(this.lights.has(name)) {
			var light = this.lights.get(name);
			Listeners.remove(light, 'click', this);
			Listeners.remove(light.firstChild, 'click', this);
			if(light._alert) {
				light._alert();
			}
			
			light.remove();
			Styles.unload('skyLight-'+name+'_'+_UUID);
			this.lights.delete(name);
		}
	},
	
	hideOnChrome: function() {
		toggleAttribute(this.container, 'hideWhenChromeVisible', Prefs.skyLightsHide);
	},
	
	init: function() {
		Listeners.add(slimChrome.container, 'WillShowSlimChrome', this, true);
		
		Prefs.listen('skyLightsHide', this);
		this.hideOnChrome();
		
		dispatch(this.container, { type: 'LoadedSkyLights', cancelable: false });
	},
	
	deinit: function() {
		dispatch(this.container, { type: 'UnloadingSkyLights', cancelable: false });
		
		Prefs.unlisten('skyLightsHide', this);
		removeAttribute(this.container, 'hideWhenChromeVisible');
		
		Listeners.remove(slimChrome.container, 'WillShowSlimChrome', this, true);
		
		// make sure all the lights are properly unloaded
		for(let light of this.lights.keys()) {
			this.remove(light);
		}
	}
};

Modules.LOADMODULE = function() {
	// in case the overlay is already loaded (don't even know if this can happen but better make sure)
	if(skyLights.container) {
		skyLights.init();
	}
	
	Overlays.overlayURI('chrome://'+objPathString+'/content/slimChrome.xul', 'skyLights', {
		onLoad: function(aWindow) { if(typeof(aWindow[objName].skyLights) != 'undefined') { aWindow[objName].skyLights.init(); } },
		onUnload: function(aWindow) { if(typeof(aWindow[objName].skyLights) != 'undefined') { aWindow[objName].skyLights.deinit(); } }
	});
};

Modules.UNLOADMODULE = function() {
	// make sure this runs in case the overlay unloads after the module
	skyLights.deinit();
	
	if(UNLOADED || !Prefs.skyLights || !Prefs.includeNavBar) {
		Overlays.removeOverlayURI('chrome://'+objPathString+'/content/slimChrome.xul', 'skyLights');
	}
};
