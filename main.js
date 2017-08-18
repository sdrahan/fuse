var lowfat = lowfat || {};

cc.game.onStart = function () {
    var sys = cc.sys;
    if (!sys.isNative && document.getElementById("cocosLoading")) //If referenced loading.js, please remove it
        document.body.removeChild(document.getElementById("cocosLoading"));

    // Pass true to enable retina display, on Android disabled by default to improve performance
    cc.view.enableRetina(sys.os === sys.OS_IOS ? true : false);

    if (sys.isMobile &&
        sys.browserType !== sys.BROWSER_TYPE_BAIDU &&
        sys.browserType !== sys.BROWSER_TYPE_WECHAT) {
        cc.view.enableAutoFullScreen(true);
    }

    cc.view.adjustViewPort(true);
    // cc.view.setOrientation(cc.ORIENTATION_PORTRAIT);
    cc.view.setDesignResolutionSize(480, 720, cc.ResolutionPolicy.FIXED_HEIGHT);
    cc.view.resizeWithBrowserSize(true);

    cc.LoaderScene.preload(g_resources, function () {
        lowfat.socialManager = {getLoginButtonShouldBeVisible: function () {return false;}};
        /*
        if (cc.sys.isNative) {
            lowfat.socialManager = {
                getLoginButtonShouldBeVisible: function () {
                    return false;
                }
            };
        } else {
            lowfat.socialManager.getUserIdAsync(function () {
                    console.log("getUserIdAsync fired successCallback")
                },
                function () {
                    console.log("getUserIdAsync fired failedCallback")
                },
                this
            );
        }
        */

        lowfat.GameStateModel.init();
        lowfat.LocalizationManager.init();

        var texture = cc.textureCache.addImage(res.spritesheet_png);
        cc.spriteFrameCache.addSpriteFrames(res.spritesheet_plist, texture);

        var gamefieldScene = new GamefieldScene();
        gamefieldScene.setup();
        cc.director.runScene(gamefieldScene);

        cc.view.setResizeCallback(function () {
            gamefieldScene.onResize();
        });
    }, this);
};
cc.game.run();