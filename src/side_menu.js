var lowfat = lowfat || {};

lowfat.SideMenu = function (gamefield) {
    this.gamefield = gamefield;
    this.container = null;
    this.layer = null;
    this.bg = null;
    this.isOpen = false;
    this.overlay = null;
    this.screenWidth = 0;
    this.isClosing = false;

    this.soundOnButton = null;
    this.soundOffButton = null;
    this.musicOnButton = null;
    this.musicOffButton = null;
    this.retryButton = null;

    this.openMenuButton = null;
    this.closeMenuButton = null;

    this.BG_TILE_HEIGHT = 72;
    this.WIN_HEIGHT = 720;
    this.TWEEN_DURATION = 0.3;
    this.MENU_BTN_COORDS = {x: 360, y: 680};
    this.MENU_BTN_HALF_SIZE = 30;
    this.MENU_WIDTH = 320;

    this.init = function (container) {
        this.container = container;

        this.overlay = new cc.LayerColor(cc.color(0, 0, 0, 50));
        this.overlay.setVisible(false);

        this.container.addChild(this.overlay);

        this.layer = new cc.Node();
        this.container.addChild(this.layer);

        this.bg = lowfat.GameSpriteManager.getSprite("SidemenuBg", 0, 0);
        this.bg.setScale(1, this.WIN_HEIGHT / this.BG_TILE_HEIGHT);
        this.layer.addChild(this.bg);
        this.layer.setPositionX(-this.MENU_WIDTH);
        this.bg.setVisible(false);

        this.openMenuButton = this.createButton("Btn_Menu", "Btn_Menu", this.MENU_BTN_COORDS.x, this.MENU_BTN_COORDS.y, this.openMenuButtonEvent);
        this.closeMenuButton = this.createButton("Btn_MenuClose", "Btn_MenuClose", this.MENU_BTN_COORDS.x, this.MENU_BTN_COORDS.y, this.closeMenuButtonEvent);
        this.layer.addChild(this.openMenuButton);
        this.layer.addChild(this.closeMenuButton);
        this.openMenuButton.setVisible(true);
        this.closeMenuButton.setVisible(false);

        this.retryButton = this.createSideMenuButton("Btn_Restart_SideMenu", "Restart", 0, this.retryButtonTouchEvent);
        this.soundOnButton = this.createSideMenuButton("Btn_Sound_On_SideMenu", "Sound", 62, this.soundButtonTouchEvent);
        this.soundOffButton = this.createSideMenuButton("Btn_Sound_Off_SideMenu", "Sound", 62, this.soundButtonTouchEvent);
        this.musicOnButton = this.createSideMenuButton("Btn_Music_On_SideMenu", "Music", 124, this.musicButtonTouchEvent);
        this.musicOffButton = this.createSideMenuButton("Btn_Music_Off_SideMenu", "Music", 124, this.musicButtonTouchEvent);

        this.updateSoundButtons();
        this.updateMusicButtons();
    };

    this.retryButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onRetryButton();
        }
    };

    this.soundButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onSoundButton();
        }
    };

    this.musicButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onMusicButton();
        }
    };

    this.onRetryButton = function () {
        this.gamefield.processRestartDuringGame();
    };

    this.onSoundButton = function () {
        lowfat.SoundManager.toggleSoundOn();
        this.updateSoundButtons();
    };

    this.onMusicButton = function () {
        lowfat.SoundManager.toggleMusicOn();
        this.updateMusicButtons();
    };

    this.updateSoundButtons = function () {
        this.soundOnButton.setVisible(lowfat.SoundManager.getSoundOn());
        this.soundOffButton.setVisible(!lowfat.SoundManager.getSoundOn());
        this.addProperSoundListener();
    };

    this.addProperSoundListener = function () {
        this.soundOnButton.setTouchEnabled(lowfat.SoundManager.getSoundOn());
        this.soundOffButton.setTouchEnabled(!lowfat.SoundManager.getSoundOn());
    };

    this.updateMusicButtons = function () {
        this.musicOnButton.setVisible(lowfat.SoundManager.getMusicOn());
        this.musicOffButton.setVisible(!lowfat.SoundManager.getMusicOn());
        this.addProperMusicListener();
    };

    this.addProperMusicListener = function () {
        this.musicOnButton.setTouchEnabled(lowfat.SoundManager.getMusicOn());
        this.musicOffButton.setTouchEnabled(!lowfat.SoundManager.getMusicOn());
    };

    this.openMenuButtonEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onOpenMenuButton();
        }
    };

    this.closeMenuButtonEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onCloseMenuButton();
        }
    };

    this.onCloseMenuButton = function () {
        this.closeMenu();
    };

    this.closeMenu = function () {
        if (this.isClosing) {
            return;
        }

        this.openMenuButton.setVisible(true);
        this.closeMenuButton.setVisible(false);
        this.openMenuButton.setTouchEnabled(false);
        this.isOpen = false;
        this.isClosing = true;

        this.layer.stopAllActions();
        var moveAction = new cc.MoveTo(this.TWEEN_DURATION, -this.MENU_WIDTH, this.layer.getPositionY()).easing(cc.easeCubicActionIn());
        var callbackAction = new cc.CallFunc(this.onCloseMenuFinished, this);
        this.layer.runAction(new cc.Sequence(moveAction, callbackAction));
    };

    this.onCloseMenuFinished = function () {
        this.bg.setVisible(false);
        this.overlay.setVisible(false);
        this.openMenuButton.setTouchEnabled(true);
        this.isClosing = false;
    };

    this.onOpenMenuButton = function () {
        this.openMenu();
    };

    this.openMenu = function () {
        this.openMenuButton.setVisible(false);
        this.closeMenuButton.setVisible(true);
        this.closeMenuButton.setTouchEnabled(false);
        this.isOpen = true;

        this.bg.setVisible(true);
        this.layer.stopAllActions();
        var moveAction = new cc.MoveTo(this.TWEEN_DURATION, 0, this.layer.getPositionY()).easing(cc.easeCubicActionOut());
        var callbackAction = new cc.CallFunc(this.onOpenMenuFinished, this);
        this.layer.runAction(new cc.Sequence(moveAction, callbackAction));
        this.overlay.setVisible(true);
    };

    this.onOpenMenuFinished = function () {
        this.closeMenuButton.setTouchEnabled(true);
    };

    this.createButton = function (outSkin, overSkin, x, y, onTriggeredEvent) {
        var button = new ccui.Button();
        var outSkinTextureName = lowfat.GameSpriteManager.getMCTextureName(outSkin);
        var overSkinTextureName = lowfat.GameSpriteManager.getMCTextureName(overSkin);
        button.loadTextures(outSkinTextureName, overSkinTextureName, "", ccui.Widget.PLIST_TEXTURE);
        button.setPosition(x, y);
        button.addTouchEventListener(onTriggeredEvent, this);
        button.setZoomScale(-0.05);
        return button;
    };

    this.createSideMenuButton = function (iconSpriteName, labelText, y, onTriggeredEvent) {
        var btnHeightExcludingSeparator = 60;
        var separatorHeight = 2;

        var button = new ccui.Button();
        var iconFrameName = lowfat.GameSpriteManager.getMCTextureName("SidemenuBtnBg");
        button.loadTextures(iconFrameName, "", "", ccui.Widget.PLIST_TEXTURE);
        button.setZoomScale(0);
        button.setAnchorPoint(0, 0);
        button.setPosition(0, 720 - y - (btnHeightExcludingSeparator + separatorHeight));
        button.addTouchEventListener(onTriggeredEvent, this);

        var label = new cc.LabelTTF(
            labelText,
            "Open Sans",
            22,
            cc.size(200, btnHeightExcludingSeparator),
            cc.TEXT_ALIGNMENT_LEFT,
            cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        label.setAnchorPoint(0, 0.5);
        label.setPosition(70, btnHeightExcludingSeparator / 2 + separatorHeight);
        button.addChild(label);

        var icon = lowfat.GameSpriteManager.getSprite(iconSpriteName, 0.5, 0.5);
        icon.setPosition(30, btnHeightExcludingSeparator / 2 + separatorHeight);
        button.addChild(icon);
        this.layer.addChild(button);
        return button;
    };

    this.processClickAndGetIfAllowed = function (eventX, eventY) {
        if (this.isOpen == false) {
            if (eventY >= (this.MENU_BTN_COORDS.y - this.MENU_BTN_HALF_SIZE)) {
                if (eventX >= this.openMenuButton.getPositionX() - this.MENU_WIDTH - this.MENU_BTN_HALF_SIZE && eventX <= this.openMenuButton.getPositionX() - this.MENU_WIDTH + this.MENU_BTN_HALF_SIZE)
                    return false;
                }
            return true;
        }

        var isInside = eventX <= this.MENU_WIDTH;
        if (!isInside) {
            this.closeMenu();
        }
        return false;
    };

    this.setMenuAvailable = function (value) {
        if (this.isOpen) {
            this.closeMenu();
        }
        this.openMenuButton.setVisible(value);
    };

    this.onResize = function (winSizeWidth) {
        this.overlay.setContentSize(winSizeWidth, 720);
        this.screenWidth = winSizeWidth;
    };
};