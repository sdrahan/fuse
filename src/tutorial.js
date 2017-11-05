var lowfat = lowfat || {};

lowfat.TutorialNew = function (spriteFactory, getBoard, removeAllBlockModelsAndViews, createBlockView, setCurrentPack, setNextPack, setScore, getScoreUI, getSideMenu, setMaxUnlockedValue, screenSizeInPoints) {
    var screenSize = screenSizeInPoints;
    var container = null;
    var isMobile = false;
    var isActive = false;
    var gameStateModel = null;
    var currentWidth = 0;
    var popups = [];
    var popupGameGoal = null;
    var popupSwipe = null;
    var popupSwap = null;
    var dropPerformed = false;
    var dropFinished = false;
    var swapPerformed = false;
    var movePerformed = false;

    function init(containerParam, isMobileParam, gameStateModelParam) {
        container = containerParam;
        isMobile = isMobileParam;
        gameStateModel = gameStateModelParam;
        isActive = true;
        dropPerformed = false;
        dropFinished = false;
        swapPerformed = false;
        movePerformed = false;

        var introString = lowfat.LocalizationManager.getString("tutorial_goal");
        introString += "\n\n";
        introString += lowfat.LocalizationManager.getString(isMobile ? "tutorial_drop_mobile" : "tutorial_drop_pc");
        popupGameGoal = createPopup(160, introString, lowfat.LocalizationManager.getString("tutorial_goal_header"));
        popupGameGoal.setPositionY(710);
        popupGameGoal.fadeIn();

        getBoard().clear();
        removeAllBlockModelsAndViews();
        createBlockView(getBoard().addBlockAt(1, 0, 1));
        createBlockView(getBoard().addBlockAt(1, 1, 1));
        createBlockView(getBoard().addBlockAt(3, 0, 1));
        createBlockView(getBoard().addBlockAt(4, 0, 1));
        setCurrentPack([1, 1]);
        setNextPack([2, 1]);
        setScore(0);
        getScoreUI().displayNewScoreInstantly(0);
        getSideMenu().setMenuAvailable(false);
        setMaxUnlockedValue(1);
    }

    function processDrop() {
        if (isActive === false || dropPerformed === true) {
            return;
        }

        popupGameGoal.fadeOut();
        dropPerformed = true;
    }

    function processSwipe() {
        if (isActive === false || movePerformed === true || isMobile === false) {
            return;
        }

        if (dropFinished) {
            popupSwipe.fadeOut();
            if (popupSwap !== null) {
                popupSwap.moveToY(710, 0.3);
            }

            if (swapPerformed === true) {
                tutorialFinished();
            }
        }

        movePerformed = true;
    }

    function processSwap() {
        if (isActive === false || swapPerformed === true) {
            return;
        }

        if (dropFinished) {
            popupSwap.fadeOut();
            if ((isMobile && movePerformed) || (isMobile == false)) {
                tutorialFinished();
            }
        }

        swapPerformed = true;
    }

    function processDropFinished() {
        if (isActive == false || dropFinished == true) {
            return;
        }

        var swapString;

        if (isMobile) {
            var popupsAmount;
            if (!swapPerformed && !movePerformed) {
                popupsAmount = 2;
            }
            else if (swapPerformed || movePerformed) {
                popupsAmount = 1;
            }
            else {
                popupsAmount = 0;
            }
            var swipeString = lowfat.LocalizationManager.getString("tutorial_swipe");
            swapString = lowfat.LocalizationManager.getString("tutorial_swap_mobile");

            if (popupsAmount == 2) {
                popupSwipe = createPopup(70, swipeString);
                popupSwap = createPopup(70, swapString);
                popupSwipe.setPositionY(710);
                popupSwap.setPositionY(630);
                popupSwipe.fadeIn();
                popupSwap.fadeIn(0.2);
            }
            else if (popupsAmount == 1) {
                if (!movePerformed) {
                    popupSwipe = createPopup(70, swipeString);
                    popupSwipe.setPositionY(710);
                    popupSwipe.fadeIn();
                } else {
                    popupSwap = createPopup(70, swapString);
                    popupSwap.setPositionY(710);
                    popupSwap.fadeIn();
                }
            } else {
                tutorialFinished();
            }
        } else {
            if (!swapPerformed) {
                swapString = lowfat.LocalizationManager.getString("tutorial_swap_pc");
                popupSwap = createPopup(90, swapString);
                popupSwap.setPositionY(710);
                popupSwap.fadeIn();
            } else {
                tutorialFinished();
            }
        }

        dropFinished = true;
    }

    function tutorialFinished() {
        getSideMenu().setMenuAvailable(true);
        gameStateModel.setIsTutorialFinished(true);
    }

    function onResize(width) {
        if (isActive == false) {
            return;
        }

        currentWidth = width;

        for (var i = 0; i < popups.length; i++) {
            popups[i].onResize(width);
        }
    }

    var BG_MIN_WIDTH = 380;
    var BG_MAX_WIDTH = 600;
    var BG_MARGIN_X = 10;
    var LABEL_MIN_WIDTH = 370;
    var LABEL_MAX_WIDTH = 580;
    var LABEL_MARGIN_X = 20;
    var HEADER_WIDTH = 580;
    var HEADER_HEIGHT = 50;
    var HEADER_MARGIN_Y = -2;

    function createPopup(popupHeight, hint, header) {
        var popup = lowfat.TutorialPopup(container, hint, header, screenSize);
        popups.push(popup);
        return popup;
    }

    function createPopupOld(popupHeight, hint, header) {
        var hasHeader = header !== undefined && header != null && header != "";
        var popupNode = new cc.Node();
        var bg = createLabelBg(popupHeight);
        var headerLabel = null;
        popupNode.setCascadeOpacityEnabled(true);
        popupNode.addChild(bg);

        if (hasHeader) {
            headerLabel = new cc.LabelTTF(
                header,
                "Arial",
                30,
                cc.size(HEADER_WIDTH, HEADER_HEIGHT),
                cc.TEXT_ALIGNMENT_CENTER,
                cc.VERTICAL_TEXT_ALIGNMENT_TOP);
            headerLabel.setAnchorPoint(0.5, 1);
            headerLabel.setColor(cc.color(0, 0, 0));
            popupNode.addChild(headerLabel);
            headerLabel.setPositionY(HEADER_MARGIN_Y);
        }

        var labelHeight = hasHeader ? popupHeight - 34 : popupHeight;
        var labelY = hasHeader ? -34 : 0;
        var label = new cc.LabelTTF(
            hint,
            "Arial",
            18,
            cc.size(LABEL_MIN_WIDTH, labelHeight),
            cc.TEXT_ALIGNMENT_CENTER,
            cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        label.setAnchorPoint(0.5, 1);
        label.setColor(cc.color(0, 0, 0));
        popupNode.addChild(label);
        label.setPositionY(labelY);

        var popup = {
            popupNode: popupNode,
            hasHeader: hasHeader,
            bg: bg,
            bgHeight: popupHeight,
            headerLabel: headerLabel,
            label: label,
            labelHeight: labelHeight,

            addToParent: function (container) {
                container.addChild(popupNode);
            },

            setPositionX: function (x) {
                this.popupNode.setPositionX(x);
            },

            setPositionY: function (y) {
                this.popupNode.setPositionY(y);
            },

            onResize: function (width) {
                var suggestedLabelWidth = width - LABEL_MARGIN_X * 2;
                var labelWidth = Math.max(Math.min(suggestedLabelWidth, LABEL_MAX_WIDTH), LABEL_MIN_WIDTH);
                var suggestedBgWidth = width - BG_MARGIN_X * 2;
                var bgWidth = Math.max(Math.min(suggestedBgWidth, BG_MAX_WIDTH), BG_MIN_WIDTH);

                this.setPositionX(width / 2);
                this.label.setDimensions(labelWidth, this.labelHeight);
                this.bg.setContentSize(bgWidth, this.bgHeight);
            },

            fadeIn: function (delay) {
                this.popupNode.setOpacity(0);
                var fadeInDuration = 0.5;
                if (delay === undefined || delay == null) {
                    this.popupNode.runAction(new cc.FadeIn(fadeInDuration));
                } else {
                    this.popupNode.runAction(new cc.Sequence(new cc.DelayTime(delay), new cc.FadeIn(fadeInDuration)));
                }
            },

            fadeOut: function () {
                var fadeOutDuration = 0.5;
                var fadeOutAction = new cc.FadeOut(fadeOutDuration);
                var callFuncAction = new cc.CallFunc(this.onFadeOutFinished, this);
                this.popupNode.runAction(new cc.Sequence(fadeOutAction, callFuncAction));
            },

            onFadeOutFinished: function () {
                this.popupNode.removeFromParent();
            },

            moveToY: function (toY, delay) {
                var delayAction = new cc.DelayTime(delay);
                var moveDuration = 0.3;
                var moveAction = new cc.MoveTo(moveDuration, this.popupNode.getPositionX(), toY).easing(cc.easeCubicActionOut());
                this.popupNode.runAction(new cc.Sequence(delayAction, moveAction));
            }
        };

        popup.addToParent(container);
        popups.push(popup);
        popup.onResize(currentWidth);
        return popup;
    }

    function createLabelBg(height) {
        var frame = spriteFactory.getFrame("TutorialBg");
        var capInsets = cc.rect(20, 20, 60, 60);
        var bg = new ccui.Scale9Sprite(frame, capInsets);
        bg.setAnchorPoint(0.5, 1);
        bg.setContentSize(BG_MIN_WIDTH, height);
        return bg;
    }

    return {
        init: init,
        processSwipe: processSwipe,
        processSwap: processSwap,
        processDrop: processDrop,
        processDropFinished: processDropFinished,
        onResize: onResize
    }
};

lowfat.TutorialPopup = function (container, descriptionText, headerText, screenSizeInPoints) {
    var node;
    var hasHeader = headerText !== undefined && headerText !== null && headerText !== "";
    var headerLabel = null;
    var descriptionLabel;
    var ANIMATION_DURATION = 0.5;
    var LABEL_MOVE_DISTANCE = 50;

    init();

    function init() {
        node = new cc.Node();
        container.addChild(node);
        node.setPosition(screenSizeInPoints.width / 2, screenSizeInPoints.height / 2);

        if (hasHeader) {
            headerLabel = createLabel("Привет!", 42, 0, cc.VERTICAL_TEXT_ALIGNMENT_BOTTOM);
            headerLabel.setOpacity(0);
        }
        descriptionLabel = createLabel("Давай играть во Fuse\nСобирай три и больше\nблоков одного цвета", 24, 1, cc.VERTICAL_TEXT_ALIGNMENT_TOP);
        descriptionLabel.setOpacity(0);
    }

    function createLabel(text, fontSize, anchorPointY, textAlignment) {
        var label = new cc.LabelTTF(
            text,
            "Open Sans",
            fontSize,
            cc.size(360, 340),
            cc.TEXT_ALIGNMENT_CENTER,
            textAlignment);
        label.setColor(cc.color(230, 230, 230));
        label.setAnchorPoint(0.5, anchorPointY);
        node.addChild(label);
        return label;
    }

    function slowlyShowWithHeader() {
        headerLabel.setPositionY(50);
        var headerFadeInAction = new cc.FadeIn(ANIMATION_DURATION);
        var headerMoveInAction = new cc.MoveBy(ANIMATION_DURATION, 0, -LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var headerSpawnAction = new cc.Spawn(headerMoveInAction, headerFadeInAction);
        headerLabel.runAction(headerSpawnAction);

        descriptionLabel.setPositionY(-LABEL_MOVE_DISTANCE);
        var descriptionFadeInAction = new cc.FadeIn(ANIMATION_DURATION);
        var descriptionMoveInAction = new cc.MoveBy(ANIMATION_DURATION, 0, LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var descriptionSpawnAction = new cc.Spawn(descriptionMoveInAction, descriptionFadeInAction);
        descriptionLabel.runAction(descriptionSpawnAction);
    }

    function slowlyShowWithoutHeader() {
        descriptionLabel.setOpacity(0);
        descriptionLabel.setPositionX(-LABEL_MOVE_DISTANCE);
        var descriptionFadeInAction = new cc.FadeIn(ANIMATION_DURATION);
        var descriptionMoveInAction = new cc.MoveBy(ANIMATION_DURATION, LABEL_MOVE_DISTANCE, 0).easing(cc.easeCubicActionOut());
        var descriptionSpawnAction = new cc.Spawn(descriptionMoveInAction, descriptionFadeInAction);
        descriptionLabel.runAction(descriptionSpawnAction);
    }

    function slowlyHideWithHeader() {
        var headerFadeOutAction = new cc.FadeOut(ANIMATION_DURATION);
        var headerMoveOutAction = new cc.MoveBy(ANIMATION_DURATION, 0, LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var headerSpawnAction = new cc.Spawn(headerMoveOutAction, headerFadeOutAction);
        headerLabel.runAction(headerSpawnAction);

        var descriptionFadeOutAction = new cc.FadeOut(ANIMATION_DURATION);
        var descriptionMoveOutAction = new cc.MoveBy(ANIMATION_DURATION, 0, -LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var descriptionSpawnAction = new cc.Spawn(descriptionMoveOutAction, descriptionFadeOutAction);
        var cleanUpAction = new cc.CallFunc(cleanUp);
        descriptionLabel.runAction(new cc.Sequence(descriptionSpawnAction, cleanUpAction));
    }

    function slowlyHideWithoutHeader() {
        var descriptionFadeOutAction = new cc.FadeOut(ANIMATION_DURATION);
        var descriptionMoveOutAction = new cc.MoveBy(ANIMATION_DURATION, LABEL_MOVE_DISTANCE, 0).easing(cc.easeCubicActionOut());
        var descriptionSpawnAction = new cc.Spawn(descriptionMoveOutAction, descriptionFadeOutAction);
        var cleanUpAction = new cc.CallFunc(cleanUp);
        descriptionLabel.runAction(new cc.Sequence(descriptionSpawnAction, cleanUpAction));
    }

    function cleanUp() {
        if (headerLabel !== null) {
            headerLabel.removeFromParent();
        }
        descriptionLabel.removeFromParent();
        node.removeFromParent();
    }

    function setPositionY(coordY) {
        node.setPositionY(coordY);
    }

    function moveToY(toY, delay) {
        var delayAction = new cc.DelayTime(delay);
        var moveDuration = 0.3;
        var moveAction = new cc.MoveTo(moveDuration, node.getPositionX(), toY).easing(cc.easeCubicActionOut());
        node.runAction(new cc.Sequence(delayAction, moveAction));
    }

    function fadeIn() {
        if (hasHeader) {
            slowlyShowWithHeader();
        } else {
            slowlyShowWithoutHeader();
        }
    }

    function fadeOut() {
        if (hasHeader) {
            slowlyHideWithHeader();
        } else {
            slowlyHideWithoutHeader();
        }
    }

    function onResize(screenSize) {
        node.setPosition(screenSize.width / 2, screenSize.height / 2);
    }

    return {
        setPositionY: setPositionY,
        moveToY: moveToY,
        fadeIn: fadeIn,
        fadeOut: fadeOut,
        onResize: onResize
    }
};