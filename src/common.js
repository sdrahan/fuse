var lowfat = lowfat || {};

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

lowfat.SpriteFactory = {
    getSprite: function (spriteName, anchorPointX, anchorPointY) {
        var sprite = new cc.Sprite(this.getFrame(spriteName));
        if (typeof anchorPointX !== "undefined" && typeof anchorPointY !== "undefined") {
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

lowfat.AnalyticsManager = {
    analyticsSystems: [],

    init: function () {

    },

    sendEvent: function (eventCategory, eventName, eventValue, eventOutcome) {

    }
};

lowfat.analyticsEvents = {
    CATEGORY_GENERAL: "general",
    GAME_INITIALIZED: "gameInitialized",
    GAME_LOST: "gameLost",
    RESTART_DURING_GAME: "restartDuringGame",
    RESTART_AFTER_GAME_END: "restartAfterGameEnd",
    FIRST_DROP_MADE: "firstDropMade",
    ROUND_DURATION_UNTIL_LOSE: "roundDurationUntilLose",

    CATEGORY_TUTORIAL: "tutorial",
    TUTORIAL_FINISHED: "tutorialFinished"
};

lowfat.SponsorAPIManager = {
    startGameAlreadySent: false,

    sendReplayEvent: function () {
        try {
            parent.cmgGameEvent("replay");
        }
        catch (e) {
            cc.warn("Can't send replay event");
        }
    },

    sendStartGameEvent: function () {
        if (this.startGameAlreadySent == true) {
            return;
        }

        try {
            this.startGameAlreadySent = true;
            parent.cmgGameEvent("start");
        }
        catch (e) {
            cc.warn("Can't send start event");
        }
    }
};
