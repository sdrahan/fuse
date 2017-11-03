var lowfat = lowfat || {};

lowfat.GameOverPopup = function (spriteFactory, container, screenSizeInPoints, processNewGame, score) {

    var popupNode;
    var restartButton;

    var HIDDEN_Y = -174;

    function show() {
        popupNode = new cc.Node();
        popupNode.setPosition(screenSizeInPoints.width / 2, HIDDEN_Y);
        container.addChild(popupNode);
        var bg = spriteFactory.getSprite("PopupGameOver");
        popupNode.addChild(bg);
        restartButton = createButton("PopupButtonRestart", 0, -108, newGameButtonTouchEvent);
        popupNode.addChild(restartButton);

        var headerLabel = new cc.LabelTTF(
            "GAME OVER",
            "Open Sans",
            38,
            cc.size(400, 50),
            cc.TEXT_ALIGNMENT_CENTER,
            cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        headerLabel.setColor(cc.color(255, 112, 0));
        headerLabel.setPosition(0, 130);
        popupNode.addChild(headerLabel);

        var scoreLabel = new cc.LabelTTF(
            score,
            "Open Sans",
            52,
            cc.size(240, 50),
            cc.TEXT_ALIGNMENT_CENTER,
            cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        scoreLabel.setColor(cc.color(49, 63, 160));
        scoreLabel.setPosition(0, 10);
        popupNode.addChild(scoreLabel);

        var moveInAction = cc.moveTo(0.7, screenSizeInPoints.width / 2, screenSizeInPoints.height / 2).easing(cc.easeBackOut());
        popupNode.runAction(moveInAction);
    }

    function createButton(buttonSkin, x, y, onTriggeredEvent) {
        var button = new ccui.Button();
        var outSkinTextureName = spriteFactory.getMCTextureName(buttonSkin);
        button.loadTextures(outSkinTextureName, "", "", ccui.Widget.PLIST_TEXTURE);
        button.setPosition(x, y);
        button.addTouchEventListener(onTriggeredEvent, this);
        button.setZoomScale(-0.05);
        return button;
    }

    function newGameButtonTouchEvent(sender, type) {
        if (type === ccui.Widget.TOUCH_ENDED) {
            onNewGameButton();
        }
    }

    function onNewGameButton() {
        slowlyHide();
        getScoreUI().slowlyShow();
    }

    function slowlyHide() {
        restartButton.setTouchEnabled(false);
        var moveOutAction = cc.moveTo(0.7, screenSizeInPoints.width / 2, HIDDEN_Y).easing(cc.easeBackIn());
        var callFuncAction = new cc.CallFunc(hideFinished);
        popupNode.runAction(new cc.Sequence(moveOutAction, callFuncAction));
    }

    function hideFinished() {
        processNewGame();
    }

    return {
        show: show
    }
};