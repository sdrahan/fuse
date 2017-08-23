var lowfat = lowfat || {};

lowfat.Background = function (spriteFactory, container, initialScreenSize) {
    var screenSizeInPoints = initialScreenSize;
    var bgGradient = null;
    var bgLeftSprite = null;
    var bgRightSprite = null;

    function init() {
        bgGradient = new cc.LayerGradient(cc.color(89, 35, 113), cc.color(33, 25, 87));
        container.addChild(bgGradient);
        bgLeftSprite = spriteFactory.getSprite("BgLeft", 0, 0);
        container.addChild(bgLeftSprite);
        bgRightSprite = spriteFactory.getSprite("BgRight", 1, 0);
        container.addChild(bgRightSprite);

        bgLeftSprite.setPositionX(-bgLeftSprite.getContentSize().width);
        bgRightSprite.setPositionX(screenSizeInPoints.width + bgRightSprite.getContentSize().width);

        fadeSideSpritesIn();
    }

    function fadeSideSpritesIn() {
        var leftSpriteMoveAction = new cc.MoveTo(1.5, 0, 0).easing(cc.easeCubicActionOut());
        var rightSpriteMoveAction = new cc.MoveTo(1.5, screenSizeInPoints.width, 0).easing(cc.easeCubicActionOut());
        bgLeftSprite.runAction(leftSpriteMoveAction);
        bgRightSprite.runAction(rightSpriteMoveAction);
    }

    function onResize(screenSize) {
        screenSizeInPoints = screenSize;
        bgGradient.setContentSize(screenSizeInPoints.width, screenSizeInPoints.height);
        bgRightSprite.setPositionX(screenSizeInPoints.width);
    }

    return {
        init: init,
        fadeSideSpritesIn: fadeSideSpritesIn,
        onResize: onResize
    }
};