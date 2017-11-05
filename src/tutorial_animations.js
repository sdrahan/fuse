var lowfat = lowfat || {};

lowfat.TutorialIntro = function (container, screenSizeInPoints) {
    var node;
    var headerLabel;
    var descriptionLabel;
    var ANIMATION_DURATION = 0.5;
    var LABEL_MOVE_DISTANCE = 50;

    function show() {
        node = new cc.Node();
        container.addChild(node);
        node.setPosition(screenSizeInPoints.width / 2, screenSizeInPoints.height / 2);
        headerLabel = createLabel("Привет!", 42, 0, cc.VERTICAL_TEXT_ALIGNMENT_BOTTOM);
        descriptionLabel = createLabel("Давай играть во Fuse\nСобирай три и больше\nблоков одного цвета", 24, 1, cc.VERTICAL_TEXT_ALIGNMENT_TOP);
        slowlyAppear();
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

    function slowlyAppear() {
        headerLabel.setPositionY(50);
        headerLabel.setOpacity(0);
        var headerFadeInAction = new cc.FadeIn(ANIMATION_DURATION);
        var headerMoveInAction = new cc.MoveBy(ANIMATION_DURATION, 0, -LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var headerSpawnAction = new cc.Spawn(headerMoveInAction, headerFadeInAction);
        headerLabel.runAction(headerSpawnAction);

        descriptionLabel.setPositionY(-LABEL_MOVE_DISTANCE);
        descriptionLabel.setOpacity(0);
        var descriptionFadeInAction = new cc.FadeIn(ANIMATION_DURATION);
        var descriptionMoveInAction = new cc.MoveBy(ANIMATION_DURATION, 0, LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var descriptionSpawnAction = new cc.Spawn(descriptionMoveInAction, descriptionFadeInAction);
        descriptionLabel.runAction(descriptionSpawnAction);
    }

    function slowlyHide() {
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

    function cleanUp() {
        headerLabel.removeFromParent();
        descriptionLabel.removeFromParent();
        node.removeFromParent();
    }

    function onResize() {
        node.setPosition(screenSizeInPoints.width / 2, screenSizeInPoints.height / 2);
    }

    return {
        show: show,
        slowlyHide: slowlyHide,
        onResize: onResize
    }
};


lowfat.TutorialMobileRotate = function (container, spriteFactory, screenSizeInPoints) {
    var node;
    var finger;
    var ring;
    var descriptionLabel;
    var ANIMATION_DURATION = 0.5;
    var LABEL_MOVE_DISTANCE = 50;

    function show() {
        node = new cc.Node();
        container.addChild(node);
        node.setPosition(screenSizeInPoints.width / 2, screenSizeInPoints.height / 2);

        ring = spriteFactory.getSprite("TutorialRing", 0.5, 0.5);
        node.addChild(ring);
        ring.setOpacity(0);
        ring.setScale(0, 0);
        ring.setPosition(42, 20);

        finger = spriteFactory.getSprite("TutorialFinger", 0, 0);
        node.addChild(finger);
        finger.setOpacity(0);
        finger.setPosition(50, -90);
        finger.setRotation(-4);

        descriptionLabel = createLabel("Тапни по экрану\nчтобы вращать блоки", 24, 1, cc.VERTICAL_TEXT_ALIGNMENT_TOP);
        descriptionLabel.setPositionY(-90);
        slowlyAppear();
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

    function slowlyAppear() {
        finger.setPositionY(-90 + 50);
        finger.setOpacity(0);
        var fingerFadeInAction = new cc.FadeIn(ANIMATION_DURATION);
        var fingerMoveInAction = new cc.MoveBy(ANIMATION_DURATION, 0, -LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var fingerSpawnAction = new cc.Spawn(fingerMoveInAction, fingerFadeInAction);
        finger.runAction(fingerSpawnAction);

        descriptionLabel.setPositionY(-90 - LABEL_MOVE_DISTANCE);
        descriptionLabel.setOpacity(0);
        var descriptionFadeInAction = new cc.FadeIn(ANIMATION_DURATION);
        var descriptionMoveInAction = new cc.MoveBy(ANIMATION_DURATION, 0, LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var descriptionSpawnAction = new cc.Spawn(descriptionMoveInAction, descriptionFadeInAction);
        var callFuncAction = new cc.CallFunc(playMainAnimation);
        var sequence = new cc.Sequence(descriptionSpawnAction, callFuncAction);
        descriptionLabel.runAction(sequence);
    }

    function playMainAnimation() {
        var delay = 0.5;
        var fingerDelay = new cc.DelayTime(delay);
        var pressIn = new cc.MoveBy(0.2, -17, 16);
        var rotateIn = new cc.RotateBy(0.2, -3);
        var spawnIn = new cc.Spawn(pressIn, rotateIn);
        var pressOut = new cc.MoveBy(0.4, 17, -16);
        var rotateOut = new cc.RotateBy(0.4, 3);
        var spawnOut = new cc.Spawn(pressOut, rotateOut);
        var fingerSequence = new cc.Sequence(fingerDelay, spawnIn, spawnOut).repeatForever();
        finger.runAction(fingerSequence);

        var ringDelay = new cc.DelayTime(delay + 0.2);
        var ringScaleIn = new cc.ScaleTo(0.4, 1.5, 1.5);
        var ringFadeOut = new cc.FadeOut(0.4);
        var resetAndShowRingAction = new cc.CallFunc(resetAndShowRing);
        var ringScaleAndFadeOut = new cc.Spawn(ringScaleIn, ringFadeOut);
        var ringSequence = new cc.Sequence(ringDelay, resetAndShowRingAction, ringScaleAndFadeOut).repeatForever();
        ring.runAction(ringSequence);
    }

    function resetAndShowRing() {
        ring.setVisible(true);
        ring.setOpacity(255);
        ring.setScale(0.5);
    }

    function slowlyHide() {
        finger.stopAllActions();
        ring.stopAllActions();
        ring.removeFromParent();

        var fingerFadeOutAction = new cc.FadeOut(ANIMATION_DURATION);
        var fingerMoveOutAction = new cc.MoveBy(ANIMATION_DURATION, 0, LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var fingerSpawnAction = new cc.Spawn(fingerMoveOutAction, fingerFadeOutAction);
        finger.runAction(fingerSpawnAction);

        var descriptionFadeOutAction = new cc.FadeOut(ANIMATION_DURATION);
        var descriptionMoveOutAction = new cc.MoveBy(ANIMATION_DURATION, 0, -LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var descriptionSpawnAction = new cc.Spawn(descriptionMoveOutAction, descriptionFadeOutAction);
        var cleanUpAction = new cc.CallFunc(cleanUp);
        descriptionLabel.runAction(new cc.Sequence(descriptionSpawnAction, cleanUpAction));
    }

    function cleanUp() {
        finger.removeFromParent();
        ring.removeFromParent();
        descriptionLabel.removeFromParent();
        node.removeFromParent();
    }

    function onResize() {
        node.setPosition(screenSizeInPoints.width / 2, screenSizeInPoints.height / 2);
    }

    return {
        show: show,
        slowlyHide: slowlyHide,
        onResize: onResize
    }
};

lowfat.TutorialMobileSwipe = function (container, spriteFactory, screenSizeInPoints) {
    var node;
    var finger;
    var descriptionLabel;
    var ANIMATION_DURATION = 0.5;
    var LABEL_MOVE_DISTANCE = 50;

    function show() {
        node = new cc.Node();
        container.addChild(node);
        node.setPosition(screenSizeInPoints.width / 2, screenSizeInPoints.height / 2);

        finger = spriteFactory.getSprite("TutorialFinger", 0, 0);
        node.addChild(finger);
        finger.setOpacity(0);
        finger.setPosition(50, -90);
        finger.setRotation(-4);

        descriptionLabel = createLabel("Свайпай влево и вправо\nчтобы двигать блоки", 24, 1, cc.VERTICAL_TEXT_ALIGNMENT_TOP);
        descriptionLabel.setPositionY(-90);
        slowlyAppear();
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

    function slowlyAppear() {
        finger.setPositionY(-90 + 50);
        finger.setOpacity(0);
        var fingerFadeInAction = new cc.FadeIn(ANIMATION_DURATION);
        var fingerMoveInAction = new cc.MoveBy(ANIMATION_DURATION, 0, -LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var fingerSpawnAction = new cc.Spawn(fingerMoveInAction, fingerFadeInAction);
        finger.runAction(fingerSpawnAction);

        descriptionLabel.setPositionY(-90 - LABEL_MOVE_DISTANCE);
        descriptionLabel.setOpacity(0);
        var descriptionFadeInAction = new cc.FadeIn(ANIMATION_DURATION);
        var descriptionMoveInAction = new cc.MoveBy(ANIMATION_DURATION, 0, LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var descriptionSpawnAction = new cc.Spawn(descriptionMoveInAction, descriptionFadeInAction);
        var callFuncAction = new cc.CallFunc(playMainAnimation);
        var sequence = new cc.Sequence(descriptionSpawnAction, callFuncAction);
        descriptionLabel.runAction(sequence);
    }

    function playMainAnimation() {
        var delay = 1;
        var delayLeft = new cc.DelayTime(delay);
        var swipeLeft = new cc.MoveBy(0.3, -56, 0).easing(cc.easeQuadraticActionIn());
        var rotateLeft = new cc.RotateBy(0.2, -5);
        var swipeLeftSpawn = new cc.Spawn(swipeLeft, rotateLeft);
        var delayRight = new cc.DelayTime(delay);
        var swipeRight = new cc.MoveBy(0.3, 56, 0).easing(cc.easeQuadraticActionIn());
        var rotateRight = new cc.RotateBy(0.2, 5);
        var swipeRightSpawn = new cc.Spawn(swipeRight, rotateRight);
        var swipeSequence = new cc.Sequence(delayLeft, swipeLeftSpawn, delayRight, swipeRightSpawn).repeatForever();
        finger.runAction(swipeSequence);
    }

    function slowlyHide() {
        finger.stopAllActions();

        var fingerFadeOutAction = new cc.FadeOut(ANIMATION_DURATION);
        var fingerMoveOutAction = new cc.MoveBy(ANIMATION_DURATION, 0, LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var fingerSpawnAction = new cc.Spawn(fingerMoveOutAction, fingerFadeOutAction);
        finger.runAction(fingerSpawnAction);

        var descriptionFadeOutAction = new cc.FadeOut(ANIMATION_DURATION);
        var descriptionMoveOutAction = new cc.MoveBy(ANIMATION_DURATION, 0, -LABEL_MOVE_DISTANCE).easing(cc.easeCubicActionOut());
        var descriptionSpawnAction = new cc.Spawn(descriptionMoveOutAction, descriptionFadeOutAction);
        var cleanUpAction = new cc.CallFunc(cleanUp);
        descriptionLabel.runAction(new cc.Sequence(descriptionSpawnAction, cleanUpAction));
    }

    function cleanUp() {
        finger.removeFromParent();
        descriptionLabel.removeFromParent();
        node.removeFromParent();
    }

    function onResize() {
        node.setPosition(screenSizeInPoints.width / 2, screenSizeInPoints.height / 2);
    }

    return {
        show: show,
        slowlyHide: slowlyHide,
        onResize: onResize
    }
};