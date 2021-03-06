// VERSION = '1.3';

objName = 'theFoxOnlyBetter';
objPathString = 'thefoxonlybetter';
addonUUID = '9cb2c7a0-5224-11e4-916c-0800200c9a66';

addonUris = {
	homepage: 'https://addons.mozilla.org/firefox/addon/the-fox-only-better/',
	support: 'https://github.com/Quicksaver/The-Fox--Only-Better/issues',
	fullchangelog: 'https://github.com/Quicksaver/The-Fox--Only-Better/commits/master',
	email: 'mailto:quicksaver@gmail.com',
	profile: 'https://addons.mozilla.org/firefox/user/quicksaver/',
	api: 'http://fasezero.com/addons/api/thefoxonlybetter',
	development: 'http://fasezero.com/addons/'
};

prefList = {
	slimChrome: true,
	miniOnAllInput: false,
	miniOnChangeLocation: true,
	miniOnTabSelect: false,
	includeNavBar: true,
	useMouse: true,
	delayIn: 75,
	delayOut: 250,
	slimStyle: 'australis',
	slimAnimation: 'rollout',
	
	skyLights: true,
	skyLightsHide: true,
	
	slimChromeKeycode: 'VK_F9',
	slimChromeAccel: false,
	slimChromeShift: false,
	slimChromeAlt: false
};

paneList = [
	[ 'paneSlimChrome', true ]
];

function startAddon(window) {
	prepareObject(window);
	window[objName].Modules.load(objName, true);
}

function onStartup(aReason) {
	Modules.load('compatibilityFix/sandboxFixes');
	Modules.load('keysets');
	
	// Apply the add-on to every window opened and to be opened
	Windows.callOnAll(startAddon, 'navigator:browser');
	Windows.register(startAddon, 'domwindowopened', 'navigator:browser');
}

function onShutdown(aReason) {
	// remove the add-on from all windows
	Windows.callOnAll(removeObject, null, null, true);
	
	Modules.unload('keysets');
	Modules.unload('compatibilityFix/sandboxFixes');
}
