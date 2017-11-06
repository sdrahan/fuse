var lowfat = lowfat || {};

lowfat.SideMenu = function(containerParam, spriteFactory, soundManager, processRestartDuringGame) {
    var container = null;
    var layer = null;
    var bg = null;
    var isOpen = false;
    var overlay = null;
    var isClosing = false;
    
    var soundOnButton = null;
    var soundOffButton = null;
    var musicOnButton = null;
    var musicOffButton = null;
    var retryButton = null;
    var openMenuButton = null;
    var closeMenuButton = null;
    
    var BG_TILE_HEIGHT = 72;
    var WIN_HEIGHT = 720;
    var TWEEN_DURATION = 0.3;
    var MENU_BTN_COORDS = {x: 360, y: 680};
    var MENU_BTN_HALF_SIZE = 30;
    var MENU_WIDTH = 320;

    function init () {
        container = containerParam;

        overlay = new cc.LayerColor(cc.color(0, 0, 0, 50));
        overlay.setVisible(false);

        container.addChild(overlay);

        layer = new cc.Node();
        container.addChild(layer);

        bg = spriteFactory.getSprite("SidemenuBg", 0, 0);
        bg.setScale(1, WIN_HEIGHT / BG_TILE_HEIGHT);
        layer.addChild(bg);
        layer.setPositionX(-MENU_WIDTH);
        bg.setVisible(false);

        openMenuButton = createButton("Btn_Menu", "Btn_Menu", MENU_BTN_COORDS.x, MENU_BTN_COORDS.y, openMenuButtonEvent);
        closeMenuButton = createButton("Btn_MenuClose", "Btn_MenuClose", MENU_BTN_COORDS.x, MENU_BTN_COORDS.y, closeMenuButtonEvent);
        layer.addChild(openMenuButton);
        layer.addChild(closeMenuButton);
        openMenuButton.setVisible(true);
        closeMenuButton.setVisible(false);

        retryButton = createSideMenuButton("Btn_Restart_SideMenu", lowfat.LocalizationManager.getString("sidemenu_restart"), 0, retryButtonTouchEvent);
        soundOnButton = createSideMenuButton("Btn_Sound_On_SideMenu",  lowfat.LocalizationManager.getString("sidemenu_sound"), 62, soundButtonTouchEvent);
        soundOffButton = createSideMenuButton("Btn_Sound_Off_SideMenu", lowfat.LocalizationManager.getString("sidemenu_sound"), 62, soundButtonTouchEvent);
        musicOnButton = createSideMenuButton("Btn_Music_On_SideMenu", lowfat.LocalizationManager.getString("sidemenu_music"), 124, musicButtonTouchEvent);
        musicOffButton = createSideMenuButton("Btn_Music_Off_SideMenu", lowfat.LocalizationManager.getString("sidemenu_music"), 124, musicButtonTouchEvent);

        updateSoundButtons();
        updateMusicButtons();
    }

    function retryButtonTouchEvent (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            onRetryButton();
        }
    }

    function soundButtonTouchEvent (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            onSoundButton();
        }
    }

    function musicButtonTouchEvent (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            onMusicButton();
        }
    }

    function onRetryButton () {
        processRestartDuringGame();
    }

    function onSoundButton () {
        soundManager.toggleSoundOn();
        updateSoundButtons();
    }

    function onMusicButton () {
        soundManager.toggleMusicOn();
        updateMusicButtons();
    }

    function updateSoundButtons () {
        soundOnButton.setVisible(soundManager.getSoundOn());
        soundOffButton.setVisible(!soundManager.getSoundOn());
        addProperSoundListener();
    }

    function addProperSoundListener () {
        soundOnButton.setTouchEnabled(soundManager.getSoundOn());
        soundOffButton.setTouchEnabled(!soundManager.getSoundOn());
    }

    function updateMusicButtons () {
        musicOnButton.setVisible(soundManager.getMusicOn());
        musicOffButton.setVisible(!soundManager.getMusicOn());
        addProperMusicListener();
    }

    function addProperMusicListener () {
        musicOnButton.setTouchEnabled(soundManager.getMusicOn());
        musicOffButton.setTouchEnabled(!soundManager.getMusicOn());
    }

    function openMenuButtonEvent (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            onOpenMenuButton();
        }
    }

    function closeMenuButtonEvent (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            onCloseMenuButton();
        }
    }

    function onCloseMenuButton () {
        closeMenu();
    }

    function closeMenu () {
        if (isClosing) {
            return;
        }

        openMenuButton.setVisible(true);
        closeMenuButton.setVisible(false);
        openMenuButton.setTouchEnabled(false);
        isOpen = false;
        isClosing = true;

        layer.stopAllActions();
        var moveAction = new cc.MoveTo(TWEEN_DURATION, -MENU_WIDTH, layer.getPositionY()).easing(cc.easeCubicActionIn());
        var callbackAction = new cc.CallFunc(onCloseMenuFinished, this);
        layer.runAction(new cc.Sequence(moveAction, callbackAction));
    }

    function onCloseMenuFinished () {
        bg.setVisible(false);
        overlay.setVisible(false);
        openMenuButton.setTouchEnabled(true);
        isClosing = false;
    }

    function onOpenMenuButton () {
        openMenu();
    }

    function openMenu () {
        openMenuButton.setVisible(false);
        closeMenuButton.setVisible(true);
        closeMenuButton.setTouchEnabled(false);
        isOpen = true;

        bg.setVisible(true);
        layer.stopAllActions();
        var moveAction = new cc.MoveTo(TWEEN_DURATION, 0, layer.getPositionY()).easing(cc.easeCubicActionOut());
        var callbackAction = new cc.CallFunc(onOpenMenuFinished, this);
        layer.runAction(new cc.Sequence(moveAction, callbackAction));
        overlay.setVisible(true);
    }

    function onOpenMenuFinished () {
        closeMenuButton.setTouchEnabled(true);
    }

    function createButton (outSkin, overSkin, x, y, onTriggeredEvent) {
        var button = new ccui.Button();
        var outSkinTextureName = spriteFactory.getMCTextureName(outSkin);
        var overSkinTextureName = spriteFactory.getMCTextureName(overSkin);
        button.loadTextures(outSkinTextureName, overSkinTextureName, "", ccui.Widget.PLIST_TEXTURE);
        button.setPosition(x, y);
        button.addTouchEventListener(onTriggeredEvent, this);
        button.setZoomScale(-0.05);
        return button;
    }

    function createSideMenuButton (iconSpriteName, labelText, y, onTriggeredEvent) {
        var btnHeightExcludingSeparator = 60;
        var separatorHeight = 2;

        var button = new ccui.Button();
        var iconFrameName = spriteFactory.getMCTextureName("SidemenuBtnBg");
        button.loadTextures(iconFrameName, "", "", ccui.Widget.PLIST_TEXTURE);
        button.setZoomScale(0);
        button.setAnchorPoint(0, 0);
        button.setPosition(0, 720 - y - (btnHeightExcludingSeparator + separatorHeight));
        button.addTouchEventListener(onTriggeredEvent, this);
        button.setCascadeOpacityEnabled(true);

        var label = new cc.LabelTTF(
            labelText,
            "Open Sans",
            28,
            cc.size(200, btnHeightExcludingSeparator),
            cc.TEXT_ALIGNMENT_LEFT,
            cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        label.setFontFillColor(cc.color(123, 32, 163));
        label.setAnchorPoint(0, 0.5);
        label.setPosition(75, btnHeightExcludingSeparator / 2 + separatorHeight);
        button.addChild(label);

        var icon = spriteFactory.getSprite(iconSpriteName, 0.5, 0.5);
        icon.setPosition(35, btnHeightExcludingSeparator / 2 + separatorHeight);
        button.addChild(icon);
        layer.addChild(button);
        return button;
    }

    function processClickAndGetIfAllowed (eventX, eventY) {
        if (isOpen == false) {
            if (eventY >= (MENU_BTN_COORDS.y - MENU_BTN_HALF_SIZE)) {
                if (eventX >= openMenuButton.getPositionX() - MENU_WIDTH - MENU_BTN_HALF_SIZE && eventX <= openMenuButton.getPositionX() - MENU_WIDTH + MENU_BTN_HALF_SIZE)
                    return false;
                }
            return true;
        }

        var isInside = eventX <= MENU_WIDTH;
        if (!isInside) {
            closeMenu();
        }
        return false;
    }

    function setMenuAvailable (value) {
        if (isOpen) {
            closeMenu();
        }
        openMenuButton.setVisible(value);
    }

    function setRestartAvailable (value) {
        retryButton.setTouchEnabled(value);
        retryButton.setOpacity(value ? 255 : 128);
    }

    function onResize (winSizeWidth) {
        overlay.setContentSize(winSizeWidth, 720);
    }

    return {
        init: init,
        processClickAndGetIfAllowed: processClickAndGetIfAllowed,
        setRestartAvailable: setRestartAvailable,
        setMenuAvailable: setMenuAvailable,
        onResize: onResize
    }
};