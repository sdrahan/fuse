var lowfat = lowfat || {};

lowfat.GameStateModel = {

    highScore: 0,
    score: 0,
    isFirstGame: true,
    isTutorialFinished: false,
    boardState: [],
    pack: [],
    nextPack: [],

    LOCAL_STORAGE_ID: "cosmobear_color-stack_gamestate",

    init: function () {
        // this.resetLocalStorage();
        this.load();
    },

    clearBoardState: function () {
        this.boardState = [];
        // for (var i = 0; i < GamefieldScene.COLS * GamefieldScene.ROWS; i++) {
        for (var i = 0; i < 42; i++) {
            this.boardState.push(0);
        }
    },

    updateScore: function (score) {
        this.score = score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
    },

    saveScoreOnly: function (score) {
        this.updateScore(score);
        this.save([], 0, [], []);
    },

    save: function (boardState, score, pack, nextPack) {
        if (boardState.length > 0) {
            this.boardState = boardState;
        } else {
            this.clearBoardState();
        }

        this.updateScore(score);
        this.pack = pack;
        this.nextPack = nextPack;

        var gameStateVO = {
            score: this.score,
            highScore: this.highScore,
            boardState: this.boardState,
            isTutorialFinished: this.isTutorialFinished,
            pack: this.pack,
            nextPack: this.nextPack,
            isSoundOn: lowfat.SoundManager.getSoundOn(),
            isMusicOn: lowfat.SoundManager.getMusicOn()
        };
        cc.sys.localStorage.setItem(this.LOCAL_STORAGE_ID, JSON.stringify(gameStateVO));
    },

    load: function () {
        var gameStateVO;
        var rawGameState = cc.sys.localStorage.getItem(this.LOCAL_STORAGE_ID);
        if (rawGameState === undefined) {
            gameStateVO = null;
        } else {
            gameStateVO = JSON.parse(rawGameState);
        }

        if (gameStateVO == null || gameStateVO == "") {
            console.log("No gameState found");
            this.highScore = 0;
            this.score = 0;
            this.isFirstGame = true;
            this.isTutorialFinished = false;
            this.pack = [];
            this.nextPack = [];
            this.clearBoardState();
        }
        else {
            console.log("GameState found: " + gameStateVO);
            this.highScore = gameStateVO.highScore;
            this.score = gameStateVO.score;
            this.isFirstGame = false;
            this.isTutorialFinished = gameStateVO.isTutorialFinished === undefined ? false : gameStateVO.isTutorialFinished;
            this.pack = gameStateVO.pack;
            this.nextPack = gameStateVO.nextPack;
            this.boardState = gameStateVO.boardState;
            lowfat.SoundManager.isSoundOn = gameStateVO.isSoundOn === undefined ? true : gameStateVO.isSoundOn;
            lowfat.SoundManager.isMusicOn = gameStateVO.isMusicOn === undefined ? true : gameStateVO.isMusicOn;
        }
    },

    resetLocalStorage: function () {
        this.highScore = 0;
        this.save([], 0, [], []);
    }
};

lowfat.SoundManager = {
    isSoundOn: true,
    isMusicOn: true,
    isMusicPlaying: false,
    cachedSounds: [],
    MATCH_SOUND_MAX: 5,
    MUSIC_FILE_NAME: "res/friendly_faces.mp3",

    init: function () {
        /*
         for (var i = 1; i < MATCH_SOUND_MAX; i++) {
         this.playSoundSilentlyForCaching("match_" + i);
         }
         */
    },

    playSound: function (soundId) {
        if (!this.isSoundOn) {
            return;
        }
        cc.audioEngine.playEffect(res[soundId], false);
    },

    playMatchSound: function (cascadingLength) {
        var soundIndex = cascadingLength;
        if (cascadingLength > this.MATCH_SOUND_MAX) {
            soundIndex = this.MATCH_SOUND_MAX;
        }
        this.playSound("sound_match_" + soundIndex.toString());
    },

    playSwapSound: function () {
        this.playSound("sound_swap");
    },

    playDropSound: function () {
        this.playSound("sound_drop");
    },

    playSoundSilentlyForCaching: function (soundId) {
        cc.audioEngine.setEffectsVolume(0);
        cc.audioEngine.playEffect(res[soundId], false);
    },

    playMusic: function () {
        if (this.isMusicPlaying == true || this.isMusicOn == false) {
            return;
        }
        this.isMusicPlaying = true;
        cc.audioEngine.playMusic(this.MUSIC_FILE_NAME, true);
    },

    stopMusic: function () {
        if (this.isMusicPlaying == false) {
            return;
        }
        this.isMusicPlaying = false;
        cc.audioEngine.stopMusic();
    },

    toggleSoundOn: function () {
        this.isSoundOn = !this.isSoundOn;
    },

    getSoundOn: function () {
        return this.isSoundOn;
    },

    toggleMusicOn: function () {
        this.isMusicOn = !this.isMusicOn;
        if (this.isMusicOn) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
    },

    getMusicOn: function () {
        return this.isMusicOn;
    }
};

lowfat.MathUtils = {
    radToDeg: function (rad) {
        return rad / (Math.PI / 180);
    },

    degToRad: function (deg) {
        return deg * (Math.PI / 180);
    }
};


lowfat.GraphicUtils = {
    putSpriteOnTop: function (sprite) {
        var spriteParent = sprite.getParent();
        this.retain(sprite);
        sprite.removeFromParent(false);
        spriteParent.addChild(sprite);
        this.release(sprite);
    },

    retain: function (node) {
        if (cc.sys.isNative) {
            node.retain();
        }
    },

    release: function (node) {
        if (cc.sys.isNative) {
            node.release();
        }
    }
};

lowfat.GameSpriteManager = {
    getSprite: function (spriteName, anchorPointX, anchorPointY) {
        var sprite = new cc.Sprite(this.getFrame(spriteName));
        if (typeof anchorPointX != "undefined" && typeof anchorPointY != "undefined") {
            sprite.setAnchorPoint(anchorPointX, anchorPointY);
        }
        return sprite;
    },
    getFrame: function (spriteName) {
        var frame;
        frame = cc.spriteFrameCache.getSpriteFrame(this.getMCTextureName(spriteName));
        if (frame == null) {
            frame = cc.spriteFrameCache.getSpriteFrame(spriteName);
        }

        if (frame == null) {
            console.log("Couldn't find frame: " + spriteName);
        }

        return frame;
    },
    getMCTextureName: function (textureName) {
        return textureName + "0000"
    }
};

lowfat.LocalizationManager = {
    localization: null,

    init: function () {
        var allLanguages = cc.loader.getRes(res["localization_json"]);
        if (allLanguages === undefined) {
            return;
        }
        if (allLanguages.hasOwnProperty(cc.sys.language)) {
            this.localization = allLanguages[cc.sys.language];
        } else {
            this.localization = allLanguages["en"]
        }
    },

    getString: function (stringId) {
        if (this.localization != null && this.localization.hasOwnProperty(stringId)) {
            return this.localization[stringId];
        } else {
            return stringId;
        }
    }
};