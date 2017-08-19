var lowfat = lowfat || {};

lowfat.IngameUI = function (spriteFactory, soundManager, getScoreUI, processNewGame, processRestartDuringGame) {
    this.container = null;
    this.spriteFactory = spriteFactory;
    this.soundManager = soundManager;

    this.getScoreUI = getScoreUI;
    this.processNewGame = processNewGame;

    this.soundOnButton = null;
    this.soundOffButton = null;
    this.musicOnButton = null;
    this.musicOffButton = null;
    this.retryButton = null;
    this.newGameButton = null;
    this.socialConnectButton = null;
    this.shareTwitterButton = null;

    this.RETRY_BTN_COORDS = {x: 40, y: 680};
    this.MUSIC_BTN_COORDS = {x: 40, y: 680};
    this.SOUND_BTN_COORDS = {x: 100, y: 680};

    this.NEW_GAME_BTN_Y_NORMAL = 190;
    this.NEW_GAME_BTN_Y_HIDDEN = -160;

    this.SOCIAL_CONNECT_BTN_X_RELATIVE_TO_CENTER = -120;
    this.SOCIAL_CONNECT_BTN_Y_NORMAL = 250;
    this.SOCIAL_CONNECT_BTN_Y_HIDDEN = -100;

    this.SHARE_TWITTER_BTN_X_RELATIVE_TO_CENTER = 120;
    this.SHARE_TWITTER_BTN_Y_NORMAL = 250;
    this.SHARE_TWITTER_BTN_Y_HIDDEN = -100;

    this.BTN_HALF_SIZE = 24;

    this.init = function (container) {
        this.container = container;

        this.retryButton = this.createButton("Btn_Restart", "Btn_Restart_Over", this.RETRY_BTN_COORDS.x, this.RETRY_BTN_COORDS.y, this.retryButtonTouchEvent);
        this.soundOnButton = this.createButton("Btn_Sound_On", "Btn_Sound_On_Over", 0, 0, this.soundButtonTouchEvent);
        this.soundOffButton = this.createButton("Btn_Sound_Off", "Btn_Sound_Off_Over", 0, 0, this.soundButtonTouchEvent);
        this.musicOnButton = this.createButton("Btn_Music_On", "Btn_Music_On_Over", 0, 0, this.musicButtonTouchEvent);
        this.musicOffButton = this.createButton("Btn_Music_Off", "Btn_Music_Off_Over", 0, 0, this.musicButtonTouchEvent);
        this.newGameButton = this.createButton("Btn_NewGame", "Btn_NewGame_Over", 0, this.NEW_GAME_BTN_Y_HIDDEN, this.newGameButtonTouchEvent);
        this.socialConnectButton = this.createButton("Btn_MoreGames", "Btn_MoreGames_Over", 0, this.SOCIAL_CONNECT_BTN_Y_HIDDEN, this.socialConnectButtonTouchEvent);
        this.shareTwitterButton = this.createButton("Btn_ShareTwitter", "Btn_ShareTwitter_Over", 0, this.SHARE_TWITTER_BTN_Y_HIDDEN, this.shareTwitterButtonTouchEvent);

        this.updateSoundButtons();
        this.updateMusicButtons();
    };

    this.createButton = function (outSkin, overSkin, x, y, onTriggeredEvent) {
        var button = new ccui.Button();
        var outSkinTextureName = this.spriteFactory.getMCTextureName(outSkin);
        var overSkinTextureName = this.spriteFactory.getMCTextureName(overSkin);
        button.loadTextures(outSkinTextureName, overSkinTextureName, "", ccui.Widget.PLIST_TEXTURE);
        button.setPosition(x, y);
        button.addTouchEventListener(onTriggeredEvent, this);
        lowfat.GraphicUtils.retain(button);
        return button;
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

    this.newGameButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onNewGameButton();
        }
    };

    this.socialConnectButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onSocialConnectButton();
        }
    };

    this.shareTwitterButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onShareTwitterButton();
        }
    };

    this.onRetryButton = function () {
        this.gamefield.processRestartDuringGame();
    };

    this.onSoundButton = function () {
        this.soundManager.toggleSoundOn();
        this.updateSoundButtons();
    };

    this.onMusicButton = function () {
        this.soundManager.toggleMusicOn();
        this.updateMusicButtons();
    };

    this.onNewGameButton = function () {
        this.hidePostGameButtons();
        this.getScoreUI().moveToNormalPosition();
    };

    this.onSocialConnectButton = function () {
        lowfat.socialManager.loginAsync();
    };

    this.onShareTwitterButton = function () {
        window.open(lowfat.LocalizationManager.getString("twitter_share_message"), "_blank");
    };

    this.updateSoundButtons = function () {
        this.soundOnButton.setVisible(this.soundManager.getSoundOn());
        this.soundOffButton.setVisible(!this.soundManager.getSoundOn());
        this.addProperSoundListener();
    };

    this.addProperSoundListener = function () {
        this.soundOnButton.setTouchEnabled(this.soundManager.getSoundOn());
        this.soundOffButton.setTouchEnabled(!this.soundManager.getSoundOn());
    };

    this.updateMusicButtons = function () {
        this.musicOnButton.setVisible(this.soundManager.getMusicOn());
        this.musicOffButton.setVisible(!this.soundManager.getMusicOn());
        this.addProperMusicListener();
    };

    this.addProperMusicListener = function () {
        this.musicOnButton.setTouchEnabled(this.soundManager.getMusicOn());
        this.musicOffButton.setTouchEnabled(!this.soundManager.getMusicOn());
    };

    this.setEnabled = function (value) {
        if (value == false) {
            this.soundOnButton.setTouchEnabled(false);
            this.soundOffButton.setTouchEnabled(false);
            this.musicOnButton.setTouchEnabled(false);
            this.musicOffButton.setTouchEnabled(false);
            this.retryButton.setTouchEnabled(false);
        } else {
            this.retryButton.setTouchEnabled(true);
            this.addProperMusicListener();
            this.addProperSoundListener();
        }
    };

    this.onResize = function (winSizeWidth) {
        this.soundOnButton.setPosition(winSizeWidth - this.SOUND_BTN_COORDS.x, this.SOUND_BTN_COORDS.y);
        this.soundOffButton.setPosition(winSizeWidth - this.SOUND_BTN_COORDS.x, this.SOUND_BTN_COORDS.y);
        this.musicOnButton.setPosition(winSizeWidth - this.MUSIC_BTN_COORDS.x, this.MUSIC_BTN_COORDS.y);
        this.musicOffButton.setPosition(winSizeWidth - this.MUSIC_BTN_COORDS.x, this.MUSIC_BTN_COORDS.y);

        this.newGameButton.setPosition(winSizeWidth / 2, this.newGameButton.getPositionY());
        this.socialConnectButton.setPosition((winSizeWidth / 2) + this.SOCIAL_CONNECT_BTN_X_RELATIVE_TO_CENTER, this.socialConnectButton.getPositionY());
        this.shareTwitterButton.setPosition((winSizeWidth / 2) + this.SHARE_TWITTER_BTN_X_RELATIVE_TO_CENTER, this.shareTwitterButton.getPositionY());
    };

    this.setRetryButtonVisible = function (value) {
        this.retryButton.setVisible(value);
    };

    this.isOnButton = function (eventX, eventY) {
        if (eventY >= (this.RETRY_BTN_COORDS.y - this.BTN_HALF_SIZE)) {
            if ((eventX >= this.retryButton.getPositionX() - this.BTN_HALF_SIZE && eventX <= this.retryButton.getPositionX() + this.BTN_HALF_SIZE) ||
                (eventX >= this.soundOnButton.getPositionX() - this.BTN_HALF_SIZE && eventX <= this.soundOnButton.getPositionX() + this.BTN_HALF_SIZE) ||
                (eventX >= this.musicOnButton.getPositionX() - this.BTN_HALF_SIZE && eventX <= this.musicOnButton.getPositionX() + this.BTN_HALF_SIZE)) {
                return true;
            }
        }
        return false;
    };

    this.showPostGameButtons = function () {
        this.container.addChild(this.newGameButton);
        this.container.addChild(this.socialConnectButton);
        this.container.addChild(this.shareTwitterButton);

        // if (lowfat.socialManager.getLoginButtonShouldBeVisible() == false) {
        //     this.socialConnectButton.setVisible(false);
        // }

        var delayAction = new cc.DelayTime(0.5);
        var moveInAction = new cc.MoveTo(0.7, this.newGameButton.getPositionX(), this.NEW_GAME_BTN_Y_NORMAL).easing(cc.easeBackOut());
        var callFuncAction = new cc.CallFunc(this.onShowPostGameButtonsFinished, this);
        this.newGameButton.runAction(new cc.Sequence(delayAction, moveInAction));

        var moreGamesDelayAction = new cc.DelayTime(1);
        var moreGamesMoveAction = new cc.MoveTo(0.7, this.socialConnectButton.getPositionX(), this.SOCIAL_CONNECT_BTN_Y_NORMAL).easing(cc.easeBackOut());
        var shareTwitterDelayAction = new cc.DelayTime(1.2);
        var shareTwitterMoveAction = new cc.MoveTo(0.7, this.shareTwitterButton.getPositionX(), this.SHARE_TWITTER_BTN_Y_NORMAL).easing(cc.easeBackOut());
        this.socialConnectButton.runAction(new cc.Sequence(moreGamesDelayAction, moreGamesMoveAction));
        this.shareTwitterButton.runAction(new cc.Sequence(shareTwitterDelayAction, shareTwitterMoveAction, callFuncAction));
    };

    this.onShowPostGameButtonsFinished = function () {
        this.newGameButton.setTouchEnabled(true);
        this.socialConnectButton.setTouchEnabled(true);
        this.shareTwitterButton.setTouchEnabled(true);
    };

    this.hidePostGameButtons = function () {
        this.newGameButton.setTouchEnabled(false);
        this.socialConnectButton.setTouchEnabled(false);
        this.shareTwitterButton.setTouchEnabled(false);

        var moveOutAction = new cc.MoveTo(0.5, this.newGameButton.getPositionX(), this.NEW_GAME_BTN_Y_HIDDEN).easing(cc.easeQuadraticActionIn());
        var callFuncAction = new cc.CallFunc(this.onHidePostGameButtonsFinished, this);
        this.newGameButton.runAction(new cc.Sequence(moveOutAction));

        var moreGamesDelayAction = new cc.DelayTime(0.2);
        var moreGamesMoveAction = new cc.MoveTo(0.5, this.socialConnectButton.getPositionX(), this.SOCIAL_CONNECT_BTN_Y_HIDDEN).easing(cc.easeQuadraticActionIn());
        var shareTwitterDelayAction = new cc.DelayTime(0.4);
        var shareTwitterMoveAction = new cc.MoveTo(0.5, this.shareTwitterButton.getPositionX(), this.SHARE_TWITTER_BTN_Y_HIDDEN).easing(cc.easeQuadraticActionIn());
        this.socialConnectButton.runAction(new cc.Sequence(moreGamesDelayAction, moreGamesMoveAction));
        this.shareTwitterButton.runAction(new cc.Sequence(shareTwitterDelayAction, shareTwitterMoveAction, callFuncAction));
    };

    this.onHidePostGameButtonsFinished = function () {
        this.newGameButton.removeFromParent();
        this.socialConnectButton.removeFromParent();
        this.shareTwitterButton.removeFromParent();
        this.processNewGame();
    };
};