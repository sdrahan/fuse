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