var lowfat = lowfat || {};

lowfat.Gamefield = function (scene, spriteFactory, gameStateModel, soundManager, screenSize, analyticsManager) {
    var container = scene;
    var screenSizeInPoints = screenSize;

    var COLS = 6;
    var ROWS = 7;
    var MAX_VALUE = 10;
    var BLOCK_SPRITE_WIDTH = 58;
    var BOTTOM_MARGIN = 40;
    var LEFT_MARGIN = 0;
    var PACK_Y = 7;
    var PACK_LENGTH = 2;
    var DEFAULT_PACK_X = 2;
    var BLOCK_FALL_CELL_DURATION = 0.08;
    var MINIATURES_Y = 582;
    var MINIATURES_SCALE = 0.5;

    var fgContainer = null;
    var uiContainer = null;
    var board = null;
    var blocks = [];
    var topBlocks = [];
    var nextPackMiniatures = [];
    var blockPreviews = [];
    var currentPack = null;
    var nextPack = null;
    var maxUnlockedValue = 1;
    var inputIsLocked = true;
    var nextPackX = 2;
    var actionsToFinish = 0;
    var blockValueGenerator = null;
    var cascadingLength = 0;
    var scoreCalculator = null;
    var scoreUI = null;
    var score = 0;
    var hintUI = null;
    var controlSchemes = null;
    var sideMenu = null;
    var floatingScore = null;
    var grid = null;
    var flashEffect = null;
    var tutorial = null;
    var fuseTracking = null;

    function start() {
        setup();
    }

    function setup() {
        initVars();
        initLayers();
        initBoard();
        initControls();
        initFromGameState();
        initTutorial();
        initTracking();
        createNewPack();
        onResize(screenSizeInPoints);
    }

    function initVars() {
        fgContainer = null;
        board = null;
    }

    function initLayers() {
        flashEffect = lowfat.VisualEffectBackgroundHighlight();
        flashEffect.init(container);
        fgContainer = new cc.Node();
        container.addChild(fgContainer);
        uiContainer = new cc.Node();
        container.addChild(uiContainer);
        grid = spriteFactory.getSprite("Grid", 0, 0);
        fgContainer.addChild(grid);
        grid.setPosition(0, BOTTOM_MARGIN);
        var boardAppearAnimation = lowfat.BoardAppearAnimation(spriteFactory, grid, fgContainer, COLS, ROWS, BLOCK_SPRITE_WIDTH, BOTTOM_MARGIN);
        boardAppearAnimation.show();
        scoreUI = lowfat.ScoreUI(fgContainer);
        scoreUI.init();
        hintUI = lowfat.HintUI(fgContainer, spriteFactory);
        hintUI.init(MAX_VALUE);
        floatingScore = lowfat.FloatingScore(uiContainer, fgContainer);
        sideMenu = lowfat.SideMenu(uiContainer, spriteFactory, soundManager, processRestartDuringGame);
        sideMenu.init();
    }

    function initBoard() {
        board = lowfat.GameBoard(COLS, ROWS, MAX_VALUE, onNoMatchesFoundWithDelay, processChainMergesWithDelay, getMaxUnlockedValue, setMaxUnlockedValue, showFallingBlocks);
        blockValueGenerator = new lowfat.LessStupidNextValueCalculator();
        scoreCalculator = new lowfat.ScoreCalculator();
    }

    function initControls() {
        controlSchemes = [];
        if (cc.sys.isMobile) {
            controlSchemes.push(lowfat.TouchControls(movePackLeft, movePackRight, dropPack, swapPack, getInputIsLocked, getSideMenu, getScene));
        } else {
            controlSchemes.push(lowfat.KeyboardControls(movePackLeft, movePackRight, dropPack, swapPack, getInputIsLocked, getScene, getBlockPreviews));
            controlSchemes.push(lowfat.DesktopMouseControlsNoDrag(dropPack, swapPack, BLOCK_SPRITE_WIDTH, LEFT_MARGIN, COLS, ROWS,
                getScene, getInputIsLocked, getSideMenu, getFgContainer, pixelsToCellX, pixelsToCellY,
                setNextPackX, getBlockPreviews, getTopBlocks, cellToPixelsX, updateBlockPreviews));
        }

        for (var i = 0; i < controlSchemes.length; i++) {
            controlSchemes[i].init();
        }
    }

    function initFromGameState() {
        currentPack = gameStateModel.getPack().length > 0 ? gameStateModel.getPack() : null;
        nextPack = gameStateModel.getNextPack().length > 0 ? gameStateModel.getNextPack() : null;
        score = gameStateModel.getScore();

        scoreUI.showInitial(score, gameStateModel.getHighScore());

        var boardState = gameStateModel.getBoardState();
        for (var i = 0; i < boardState.length; i++) {
            if (boardState[i] > 0) {
                var col = i % COLS;
                var row = Math.floor(i / COLS);
                createBlockView(board.addBlockAt(col, row, boardState[i]));
                if (boardState[i] > maxUnlockedValue) {
                    maxUnlockedValue = boardState[i];
                }
            }
        }
        hintUI.show(maxUnlockedValue, false);
    }

    function initTutorial() {
        tutorial = lowfat.TutorialNew(spriteFactory, getBoard, removeAllBlockModelsAndViews, createBlockView, setCurrentPack, setNextPack, setScore, getScoreUI, getSideMenu, setMaxUnlockedValue, screenSizeInPoints.width, fuseTracking);
        if (gameStateModel.getIsTutorialFinished() == false || gameStateModel.getIsFirstGame()) {
            tutorial.init(uiContainer, cc.sys.isMobile, gameStateModel);
        }
    }

    function initTracking() {
        fuseTracking = lowfat.FuseTracking(analyticsManager);
    }

    function createNewPack() {
        var animationIsNeeded = true;
        if (currentPack == null) {
            if (nextPack != null) {
                currentPack = nextPack;
            }
            else {
                currentPack = generatePackValues();
                animationIsNeeded = false;
            }
            nextPack = generatePackValues();
        }

        removeNextPackMiniatureIfAny();
        createNextPackMiniature();

        topBlocks = [];
        for (var i = 0; i < currentPack.length; i++) {
            var block = board.addBlockAt(nextPackX + i, PACK_Y, currentPack[i]);
            var blockView = createBlockView(block);
            topBlocks.push(blockView);
        }
        nextPackX = DEFAULT_PACK_X;

        createPreviews();
        updateTopBlocksPosition();

        if (animationIsNeeded) {
            displayTopBlocksFromMiniatureToNormalAnimation();
            displayTopBlocksMiniatureAppearingAnimation();
        } else {
            topBlocks[0].sprite.setScale(0, 0);
            topBlocks[0].sprite.runAction(new cc.ScaleTo(0.2, 1, 1)).easing(cc.easeBackOut());
            topBlocks[1].sprite.setScale(0, 0);
            topBlocks[1].sprite.runAction(new cc.Sequence(new cc.ScaleTo(0.2, 1, 1).easing(cc.easeBackOut()), new cc.CallFunc(unlockInput)));
        }
    }

    function removeNextPackMiniatureIfAny() {
        for (var i = 0; i < nextPackMiniatures.length; i++) {
            nextPackMiniatures[i].removeFromParent();
        }
        nextPackMiniatures = [];
    }

    function createNextPackMiniature() {
        var boardCenterX = getBoardCenterX();
        var miniatureWidth = BLOCK_SPRITE_WIDTH * MINIATURES_SCALE;
        var minA = getBlockSprite(nextPack[0]);
        var minB = getBlockSprite(nextPack[1]);
        minA.setScale(MINIATURES_SCALE, MINIATURES_SCALE);
        minB.setScale(MINIATURES_SCALE, MINIATURES_SCALE);
        fgContainer.addChild(minA);
        fgContainer.addChild(minB);
        minA.setPosition(boardCenterX - miniatureWidth / 2, MINIATURES_Y);
        minB.setPosition(boardCenterX + miniatureWidth / 2, MINIATURES_Y);
        nextPackMiniatures.push(minA);
        nextPackMiniatures.push(minB);
    }

    function displayTopBlocksMiniatureAppearingAnimation() {
        for (var i = 0; i < nextPackMiniatures.length; i++) {
            nextPackMiniatures[i].setScale(0, 0);
            var delayAction = new cc.DelayTime(0.4);
            var scaleInAction = new cc.ScaleTo(0.15, MINIATURES_SCALE, MINIATURES_SCALE).easing(cc.easeBackOut());
            nextPackMiniatures[i].runAction(new cc.Sequence(delayAction, scaleInAction));
        }
    }

    function displayTopBlocksFromMiniatureToNormalAnimation() {
        var boardCenterX = getBoardCenterX();
        var miniatureWidth = BLOCK_SPRITE_WIDTH * MINIATURES_SCALE;
        var spriteA = topBlocks[0].sprite;
        var spriteB = topBlocks[1].sprite;
        spriteA.setScale(MINIATURES_SCALE, MINIATURES_SCALE);
        spriteB.setScale(MINIATURES_SCALE, MINIATURES_SCALE);
        spriteA.setPosition(boardCenterX - miniatureWidth / 2, MINIATURES_Y);
        spriteB.setPosition(boardCenterX + miniatureWidth / 2, MINIATURES_Y);
        var toXA = cellToPixelsX(topBlocks[0].block.x);
        var toYA = cellToPixelsY(topBlocks[0].block.y);
        var toXB = cellToPixelsX(topBlocks[1].block.x);
        var toYB = cellToPixelsY(topBlocks[1].block.y);
        var duration = 0.15;
        var spawnA = new cc.Spawn(new cc.ScaleTo(duration, 1, 1).easing(cc.easeCubicActionIn()), new cc.MoveTo(duration, toXA, toYA).easing(cc.easeCubicActionIn()));
        var spawnB = new cc.Spawn(new cc.ScaleTo(duration, 1, 1).easing(cc.easeCubicActionIn()), new cc.MoveTo(duration, toXB, toYB).easing(cc.easeCubicActionIn()));
        var callFuncAction = new cc.CallFunc(unlockInput);
        spriteA.runAction(spawnA);
        spriteB.runAction(new cc.Sequence(spawnB, callFuncAction));
    }

    function generatePackValues() {
        var packLength = PACK_LENGTH;
        var packValues = [];
        for (var i = 0; i < packLength; i++) {
            var value = blockValueGenerator.getValue(maxUnlockedValue);
            packValues.push(value);
        }
        return packValues;
    }

    function createPreviews() {
        for (var i = 0; i < currentPack.length; i++) {
            if (blockPreviews.length <= i) {
                var blockPreview = spriteFactory.getSprite("BlockMini" + currentPack[i]);
                fgContainer.addChild(blockPreview);
                blockPreviews.push(blockPreview);
            }
            blockPreviews[i].setVisible(true);
        }

        updateBlockPreviews();
    }

    function removePreviews() {
        for (var i = 0; i < blockPreviews.length; i++) {
            blockPreviews[i].setVisible(false);
        }
        blockPreviews = [];
    }

    function removeTopBlocks() {
        currentPack = null;
        nextPack = null;
        for (var i = 0; i < topBlocks.length; i++) {
            board.removeBlock(topBlocks[i].block);
            removeBlockView(topBlocks[i]);
        }
        topBlocks = [];
        removePreviews();
        removeNextPackMiniatureIfAny();
    }

    function movePackLeft() {
        if (inputIsLocked) {
            return;
        }

        var i;
        for (i = 0; i < topBlocks.length; i++) {
            if (topBlocks[i].block.x <= 0) {
                return;
            }
        }

        for (i = 0; i < topBlocks.length; i++) {
            topBlocks[i].sprite.stopAllActions();
            topBlocks[i].sprite.setPositionX(cellToPixelsX(topBlocks[i].block.x));
            topBlocks[i].block.x -= 1;
            topBlocks[i].sprite.runAction(new cc.MoveTo(0.15, cellToPixelsX(topBlocks[i].block.x), topBlocks[i].sprite.getPositionY()).easing(cc.easeCubicActionOut()));
        }

        updateBlockPreviews();
        soundManager.playMusic();
        tutorial.processSwipe();
    }

    function movePackRight() {
        if (inputIsLocked) {
            return;
        }

        var i;
        for (i = 0; i < topBlocks.length; i++) {
            if (topBlocks[i].block.x >= board.getCols() - 1) {
                return;
            }
        }

        for (i = 0; i < topBlocks.length; i++) {
            topBlocks[i].sprite.stopAllActions();
            topBlocks[i].sprite.setPositionX(cellToPixelsX(topBlocks[i].block.x));
            topBlocks[i].block.x += 1;
            topBlocks[i].sprite.runAction(new cc.MoveTo(0.15, cellToPixelsX(topBlocks[i].block.x), topBlocks[i].sprite.getPositionY()).easing(cc.easeCubicActionOut()));
        }

        updateBlockPreviews();
        soundManager.playMusic();
        tutorial.processSwipe();
    }

    function swapPack() {
        if (inputIsLocked) {
            return;
        }

        var blockAView = topBlocks[0];
        var blockA = blockAView.block;
        var blockBView = topBlocks[1];
        var blockB = blockBView.block;
        var blockAOldCoords = {x: blockA.x, y: blockA.y};
        var blockBOldCoords = {x: blockB.x, y: blockB.y};

        if (blockA.y == PACK_Y && blockB.y == PACK_Y) {
            if (blockA.x < blockB.x) {
                blockA.x = blockB.x;
                blockB.y = PACK_Y + 1;
            } else {
                blockB.x = blockA.x;
                blockA.y = PACK_Y + 1;
            }
        }
        else if (blockA.y > PACK_Y) {
            blockA.y = PACK_Y;
            if (blockA.x > 0) {
                blockA.x -= 1;
            } else {
                blockB.x += 1;
            }
        }
        else if (blockB.y > PACK_Y) {
            blockB.y = PACK_Y;
            if (blockB.x > 0) {
                blockB.x -= 1;
            } else {
                blockA.x += 1;
            }
        }
        else {
            cc.warn("swapPack - wrong blocks state")
        }

        updateBlockPreviews();
        var swapDuration = 0.1;
        blockAView.sprite.stopAllActions();
        blockAView.sprite.setPosition(cellToPixelsX(blockAOldCoords.x), cellToPixelsY(blockAOldCoords.y));
        blockBView.sprite.stopAllActions();
        blockBView.sprite.setPosition(cellToPixelsX(blockBOldCoords.x), cellToPixelsY(blockBOldCoords.y));
        blockAView.sprite.runAction(new cc.MoveTo(swapDuration, cellToPixelsX(blockA.x), cellToPixelsY(blockA.y)));
        blockBView.sprite.runAction(new cc.MoveTo(swapDuration, cellToPixelsX(blockB.x), cellToPixelsY(blockB.y)));

        inputIsLocked = true;
        soundManager.playMusic();
        soundManager.playSwapSound();
        callFunctionAfterDelay(swapDuration, unlockInput, this);
        tutorial.processSwap();
    }

    function unlockInput() {
        inputIsLocked = false;
    }

    function updateBlockPreviews() {
        for (var i = 0; i < topBlocks.length; i++) {
            var previewX = topBlocks[i].block.x;
            var colHeight = board.getColHeight(previewX);
            if (colHeight > ROWS || (colHeight == ROWS - 1 && topBlocks[i].block.y == PACK_Y + 1)) {
                blockPreviews[i].setVisible(false);
            } else if (!blockPreviews[i].isVisible()) {
                blockPreviews[i].setVisible(true);
            }
            var previewY = topBlocks[i].block.y > PACK_Y ? colHeight + 1 : colHeight;
            var previewXPixels = cellToPixelsX(previewX);
            var previewYPixels = cellToPixelsY(previewY);
            blockPreviews[i].setPosition(previewXPixels, previewYPixels);
        }
    }

    function updateTopBlocksPosition() {
        for (var i = 0; i < topBlocks.length; i++) {
            topBlocks[i].sprite.stopAllActions();
            topBlocks[i].sprite.setScale(1, 1);
            updateBlockViewPosition(topBlocks[i]);
        }
    }

    function dropPack() {
        if (inputIsLocked) {
            return;
        }

        preDropActions();
        updateTopBlocksPosition();

        var biggestTime = 0;
        for (var i = 0; i < topBlocks.length; i++) {
            var topBlock = topBlocks[i];
            var toX = topBlock.block.x;
            var toY = board.getColHeightIgnoringBlock(toX, topBlock.block);
            var distance = topBlock.block.y - toY;
            var secondsPerCell = BLOCK_FALL_CELL_DURATION;
            var time = secondsPerCell * distance;
            if (time > biggestTime) {
                biggestTime = time;
            }
            var moveAction = cc.moveTo(time, cellToPixelsX(toX), cellToPixelsY(toY)).easing(cc.easeCubicActionIn());
            topBlock.sprite.runAction(moveAction);
            topBlock.block.x = toX;
            topBlock.block.y = toY;
        }

        callFunctionAfterDelay(biggestTime, dropPackFinished, this);
        fuseTracking.processDrop();
    }

    function preDropActions() {
        inputIsLocked = true;

        soundManager.playDropSound();
        soundManager.playMusic();

        if (topBlocks[0].block.y > topBlocks[1].block.y) {
            topBlocks.push(topBlocks[0]);
            topBlocks.splice(0, 1);
        }

        removePreviews();
        currentPack = null;
        tutorial.processDrop();
    }

    function dropPackFinished() {
        tutorial.processDropFinished();
        cascadingLength = 0;
        topBlocks = [];
        actionsToFinish = 0;
        scoreCalculator.packDropped();
        board.searchForMatches();
    }

    function callFunctionAfterDelay(delay, callback, callbackContext, params) {
        var waitAction = new cc.DelayTime(delay);
        var callFuncAction = new cc.CallFunc(callback, callbackContext, params);
        scene.runAction(new cc.Sequence(waitAction, callFuncAction));
    }

    function onNoMatchesFoundWithDelay() {
        callFunctionAfterDelay(0.1, onNoMatchesFound, this);
    }

    function onNoMatchesFound() {
        score += scoreCalculator.getResultingScore();
        gameStateModel.setScore(gameStateModel.getScore() + scoreCalculator.getResultingScore());
        scoreUI.displayNewScore(score);

        var isLost = board.getIsLost();
        if (isLost) {
            processGameLost();
        } else {
            createNewPack();
            saveGameState();
        }
    }

    function processChainMergesWithDelay(merges) {
        callFunctionAfterDelay(0.1, processChainMergesAdapter, this, merges);
    }

    function processChainMergesAdapter(target, merges) {
        processChainMerges(merges);
    }

    function processChainMerges(merges) {
        cascadingLength += 1;
        if (cascadingLength > 1) {
            flashEffect.show(cascadingLength - 1);
        }
        soundManager.playMatchSound(cascadingLength);
        scoreCalculator.processChains(merges, cascadingLength);
        hintUI.show(maxUnlockedValue, true);
        for (var i = 0; i < merges.length; i++) {
            processChainMerge(merges[i]);
        }
        board.applyGravity();
    }

    function processChainMerge(merge) {
        // {chain: chain, resultingBlock: block};
        actionsToFinish += merge.chain.length;
        for (var i = 0; i < merge.chain.length; i++) {
            showMergingBlock(getBlockViewByModel(merge.chain[i]), merge.resultingBlock);
        }
        showBlockCreateDuringMerge(merge.resultingBlock);

        floatingScore.show(cellToPixelsX(merge.resultingBlock.x),
            cellToPixelsY(merge.resultingBlock.y),
            scoreCalculator.getChainScore(merge, cascadingLength),
            cascadingLength);

        if (merge.chain[0].value == MAX_VALUE) {
            maxUnlockedValue = 1;
            hintUI.slowlyHide(1);
        }
    }

    function showMergingBlock(blockView, resultingBlock) {
        lowfat.GraphicUtils.putSpriteOnTop(blockView.sprite);

        var oldX = blockView.block.x;
        var oldY = blockView.block.y;
        var diffX = Math.abs(resultingBlock.x - oldX);
        var diffY = Math.abs(resultingBlock.y - oldY);
        var newX = cellToPixelsX(resultingBlock.x);
        var newY = cellToPixelsY(resultingBlock.y);

        var callbackAction = new cc.CallFunc(blockMergeFinished, this, blockView);

        var upScaleAction = new cc.ScaleTo(0.1, 1.1, 1.1).easing(cc.easeCubicActionOut());
        var waitAction = new cc.DelayTime(0.15);
        var moveAction = new cc.MoveTo(0.25, newX, newY).easing(cc.easeQuarticActionIn());
        var scaleDownAction = new cc.ScaleBy(0.25, diffY > 0 ? 0.05 : 0.2, diffX > 0 ? 0.05 : 0.2).easing(cc.easeQuadraticActionOut());

        var spawn = new cc.Spawn(moveAction, scaleDownAction);
        var upSequence = new cc.Sequence(upScaleAction, waitAction);
        var mainSequence = new cc.Sequence(upSequence, spawn);

        blockView.sprite.runAction(new cc.Sequence(mainSequence, callbackAction));
    }

    function blockMergeFinished(target, blockView) {
        removeBlockView(blockView);
        actionFinished();
    }

    function showBlockCreateDuringMerge(resultingBlock) {
        actionsToFinish += 1;
        var blockView = createBlockView(resultingBlock);
        var blockSprite = blockView.sprite;
        blockSprite.setScale(0, 0);
        var delayAction = new cc.DelayTime(0.3);
        var scaleUpAction = new cc.ScaleTo(0.3, 1, 1).easing(cc.easeCubicActionIn());
        var callFuncAction = new cc.CallFunc(actionFinished, this);
        blockSprite.runAction(new cc.Sequence(delayAction, scaleUpAction, callFuncAction));
    }

    function showFallingBlocks(fallingBlocks) {
        // {block: blockOnTop, fromY: blockOnTop.y, toY: row};
        actionsToFinish += fallingBlocks.length;
        for (var i = 0; i < fallingBlocks.length; i++) {
            showFallingBlock(fallingBlocks[i]);
        }
    }

    function showFallingBlock(fallingBlockInfo) {
        var delay = 0.55;
        var block = fallingBlockInfo.block;
        var blockView = getBlockViewByModel(block);
        var newX = cellToPixelsX(block.x);
        var newY = cellToPixelsY(block.y);
        var duration = (fallingBlockInfo.fromY - fallingBlockInfo.toY) * BLOCK_FALL_CELL_DURATION;
        var delayAction = new cc.DelayTime(delay);
        var moveAction = new cc.MoveTo(duration, newX, newY).easing(cc.easeCubicActionIn());
        var callbackAction = new cc.CallFunc(blockFallFinished);
        blockView.sprite.runAction(new cc.Sequence(delayAction, moveAction, callbackAction));
    }

    function blockFallFinished() {
        actionFinished();
    }

    function actionFinished() {
        actionsToFinish -= 1;
        if (actionsToFinish <= 0) {
            if (actionsToFinish < 0) {
                cc.warn("this.actionsToFinish < 0; Why?");
            }
            scene.runAction(new cc.Sequence(new cc.DelayTime(0.5), new cc.CallFunc(board.searchForMatches, board)));
        }
    }

    function update(dt) {
        scoreUI.update(dt);
    }

    function processRestartDuringGame() {
        inputIsLocked = true;
        sideMenu.setMenuAvailable(false);
        scene.stopAllActions();
        removeTopBlocks();
        saveGameLostGameState();
        showLostAnimation(onRestartAnimationFinished);
        fuseTracking.processRestartDuringGame();
    }

    function processGameLost() {
        inputIsLocked = true;
        sideMenu.setMenuAvailable(false);
        scene.stopAllActions();
        board.clear();
        saveGameLostGameState();
        removeTopBlocks();
        showLostAnimation(onLostAnimationFinished);
        fuseTracking.processGameLost();
    }

    function processNewGame() {
        grid.runAction(new cc.FadeIn(0.1));
        sideMenu.setMenuAvailable(true);
        scoreUI.slowlyShow();
        fuseTracking.processRestartAfterGameEnd();
        restart();
    }

    function restart() {
        removeAllBlockModelsAndViews();
        board.clear();

        currentPack = null;
        nextPack = null;

        score = 0;
        scoreUI.reset();
        scoreUI.showInitial(score, gameStateModel.getHighScore());

        nextPackX = DEFAULT_PACK_X;
        maxUnlockedValue = 1;
        hintUI.reset();
        hintUI.show(maxUnlockedValue, false);

        createNewPack();

        sideMenu.setMenuAvailable(true);
    }

    function showLostAnimation(callback) {
        hintUI.slowlyHide(0);

        var columns = [];
        var i;

        for (i = 0; i < COLS; i++) {
            var columnContainer = new cc.Node();
            fgContainer.addChild(columnContainer);
            columns.push(columnContainer);
        }

        for (i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            block.sprite.stopAllActions();
            lowfat.GraphicUtils.retain(block.sprite);
            block.sprite.removeFromParent(false);
            columns[block.block.x].addChild(block.sprite);
            lowfat.GraphicUtils.release(block.sprite);
        }

        var fallDuration = 1;
        var biggestDelayDuration = 0;
        for (i = 0; i < columns.length; i++) {
            var delayDuration = Math.random();
            if (delayDuration > biggestDelayDuration) {
                biggestDelayDuration = delayDuration;
            }
            var delayAction = new cc.DelayTime(delayDuration);
            var fallAction = new cc.MoveBy(fallDuration, 0, -600).easing(cc.easeCubicActionIn());
            columns[i].runAction(new cc.Sequence(delayAction, fallAction));
        }

        callFunctionAfterDelay(biggestDelayDuration + fallDuration, callback, this, columns);
    }

    function onRestartAnimationFinished(target, columns) {
        removeBlocksAndLostAnimationColumns(columns);
        restart();
    }

    function onLostAnimationFinished(target, columns) {
        removeBlocksAndLostAnimationColumns(columns);
        grid.runAction(new cc.FadeOut(0.1));
        scoreUI.slowlyHide();
        var gameOverPopup = lowfat.GameOverPopup(spriteFactory, uiContainer, screenSizeInPoints, processNewGame, getScoreUI, score);
        gameOverPopup.show();
    }

    function removeBlocksAndLostAnimationColumns(columns) {
        removeAllBlockModelsAndViews();
        for (var i = 0; i < columns.length; i++) {
            columns[i].removeFromParent();
        }
    }

    function createBlockView(blockModel) {
        var blockSprite = getBlockSprite(blockModel.value);
        var blockView = new lowfat.BlockView(blockModel, blockSprite);
        updateBlockViewPosition(blockView);
        fgContainer.addChild(blockView.sprite);
        blocks.push(blockView);
        return blockView;
    }

    function updateBlockViewPosition(blockView) {
        blockView.sprite.setPosition(cellToPixelsX(blockView.block.x), cellToPixelsY(blockView.block.y));
    }

    function removeBlockView(blockView) {
        var index = blocks.indexOf(blockView);
        if (index < 0) {
            console.log("Trying to remove non-existing block view");
            return;
        }
        blocks[index].sprite.removeFromParent();
        blocks.splice(index, 1);
    }

    function getBlockSprite(value) {
        var blockSprite = spriteFactory.getSprite("Block" + value.toString());
        return blockSprite;
    }

    function getBlockViewByModel(block) {
        for (var i = 0; i < blocks.length; i++) {
            if (blocks[i].block == block) {
                return blocks[i];
            }
        }
        return null;
    }

    function cellToPixelsX(cell) {
        return cell * BLOCK_SPRITE_WIDTH + (BLOCK_SPRITE_WIDTH / 2) + LEFT_MARGIN;
    }

    function cellToPixelsY(cell) {
        return cell * BLOCK_SPRITE_WIDTH + (BLOCK_SPRITE_WIDTH / 2) + BOTTOM_MARGIN;
    }

    function pixelsToCellX(pixels) {
        return Math.floor((pixels - LEFT_MARGIN) / BLOCK_SPRITE_WIDTH);
    }

    function pixelsToCellY(pixels) {
        return Math.floor((pixels - BOTTOM_MARGIN) / BLOCK_SPRITE_WIDTH);
    }

    function getBoardCenterX() {
        return LEFT_MARGIN + (BLOCK_SPRITE_WIDTH * COLS) / 2;
    }

    function onResize(screenSize) {
        screenSizeInPoints = screenSize;
        var boardViewWidth = COLS * BLOCK_SPRITE_WIDTH + LEFT_MARGIN * 2;
        fgContainer.setPositionX((screenSizeInPoints.width - boardViewWidth) / 2);
        sideMenu.onResize(screenSizeInPoints.width);
        flashEffect.onResize(screenSizeInPoints.width, screenSizeInPoints.height);
        tutorial.onResize(screenSizeInPoints.width);
        scoreUI.onResize(screenSizeInPoints.width);
    }

    function saveGameState() {
        var packToSave = [currentPack[0], currentPack[1]];
        var nextPackToSave = [nextPack[0], nextPack[1]];
        gameStateModel.save(board.getDump(), score, packToSave, nextPackToSave);
    }

    function saveGameLostGameState() {
        gameStateModel.saveScoreOnly(score);
    }

    function removeAllBlockModelsAndViews() {
        for (var i = 0; i < blocks.length; i++) {
            blocks[i].sprite.removeFromParent();
        }

        blocks = [];
    }

    function getInputIsLocked() {
        return inputIsLocked;
    }

    function getTopBlocks() {
        return topBlocks;
    }

    function getSideMenu() {
        return sideMenu;
    }

    function getBlockPreviews() {
        return blockPreviews;
    }

    function getFgContainer() {
        return fgContainer;
    }

    function getScene() {
        return scene;
    }

    function setNextPackX(value) {
        nextPackX = value;
    }

    function setCurrentPack(value) {
        currentPack = value;
    }

    function setNextPack(value) {
        nextPack = value;
    }

    function setScore(value) {
        score = value;
    }

    function getMaxUnlockedValue() {
        return maxUnlockedValue;
    }

    function setMaxUnlockedValue(value) {
        maxUnlockedValue = value;
    }

    function getScoreUI() {
        return scoreUI;
    }

    function getBoard() {
        return board;
    }

    return {
        start: start,
        update: update,
        onResize: onResize
    }
};

lowfat.GameBoard = function (boardWidth, boardHeight, maxValue, onNoMatchesFoundWithDelay, processChainMergesWithDelay, getMaxUnlockedValue, setMaxUnlockedValue, showFallingBlocks) {
    var COLS = boardWidth;
    var ROWS = boardHeight;
    var MAX_VALUE = maxValue;
    var blocks = [];

    function addBlockAt(x, y, value) {
        var block = new lowfat.Block(x, y, value);
        blocks.push(block);
        return block;
    }

    function getBlockAt(x, y) {
        for (var i = 0; i < blocks.length; i++) {
            if (blocks[i].x == x && blocks[i].y == y) {
                return blocks[i];
            }
        }
        return null;
    }

    function markAllBlocksAsNonChecked() {
        for (var i = 0; i < blocks.length; i++) {
            blocks[i].isChecked = false;
        }
    }

    function searchForMatches() {
        var chains = [];
        for (var row = 0; row < ROWS; row++) {
            for (var col = 0; col < COLS; col++) {
                var block = getBlockAt(col, row);
                if (block != null && block.isChecked == false) {
                    var blocksChain = checkNextBlock(col, row, []);
                    if (blocksChain.length >= 3) {
                        chains.push(blocksChain);
                    }
                }
            }
        }
        markAllBlocksAsNonChecked();
        if (chains.length > 0) {
            processChains(chains);
        }
        else {
            onNoMatchesFoundWithDelay();
        }
    }

    function checkNextBlock(x, y, arr) {
        if (coordsAreInBoundaries(x, y) == false) {
            return arr;
        }

        var block = getBlockAt(x, y);
        var isFirstBlock = false;
        if (arr.length == 0) {
            arr = [block];
            isFirstBlock = true;
        }

        if (block == null ||
            block.isChecked == true ||
            block.value != arr[0].value ||
            (!isFirstBlock && arr.indexOf(block) >= 0)) {
            return arr;
        }

        block.isChecked = true;
        if (isFirstBlock == false) {
            arr.push(block);
        }

        checkNextBlock(x + 1, y, arr); // right
        checkNextBlock(x, y + 1, arr); // up
        checkNextBlock(x - 1, y, arr); // left
        checkNextBlock(x, y - 1, arr); // down

        return arr;
    }

    function processChains(chains) {
        checkForBlackChain(chains);
        var merges = [];
        for (var i = 0; i < chains.length; i++) {
            merges.push(processChain(chains[i]));
        }
        processChainMergesWithDelay(merges);
        // it consists of:
        // gamefield.showBlocksMerging(chain);
        // gamefield.addNewBlockView(block);
        // and when finished, gamefield should call applyGravity()
    }

    function checkForBlackChain(chains) {
        var chainIndex = -1;
        for (var i = 0; i < chains.length; i++) {
            if (chains[i][0].value == MAX_VALUE) {
                chainIndex = i;
                break;
            }
        }

        if (chainIndex < 0) {
            return chains;
        }

        var blackChain = chains[chainIndex];
        for (var x = 0; x < COLS; x++) {
            for (var y = 0; y <= ROWS + 1; y++) {
                var block = getBlockAt(x, y);
                if (block != null && blackChain.indexOf(block) < 0) {
                    blackChain.push(block);
                }
            }
        }
        return [blackChain];
    }

    function processChain(chain) {
        var x = chain[0].x;
        var y = chain[0].y;
        var value = getNextValue(chain[0].value);
        var block = addBlockAt(x, y, value);

        if (value > getMaxUnlockedValue()) {
            setMaxUnlockedValue(value);
        }

        var mergeInfo = {chain: chain, resultingBlock: block};

        for (var i = 0; i < chain.length; i++) {
            removeBlock(chain[i]);
        }

        return mergeInfo;
    }

    function applyGravity() {
        var fallingBlocks = [];
        for (var row = 0; row <= ROWS - 1; row++) {
            for (var col = 0; col < COLS; col++) {
                if (getBlockAt(col, row) == null) {
                    var blockFound = false;
                    var rowToCheck = row + 1;
                    while (rowToCheck <= ROWS + 1 && blockFound == false) {
                        var blockOnTop = getBlockAt(col, rowToCheck);
                        if (blockOnTop != null) {
                            blockFound = true;
                            var fallingBlockInfo = {block: blockOnTop, fromY: blockOnTop.y, toY: row};
                            fallingBlocks.push(fallingBlockInfo);
                            blockOnTop.y = row;
                        }
                        else {
                            rowToCheck++;
                        }
                    }
                }
            }
        }
        showFallingBlocks(fallingBlocks);
        // after gamefield finishes, if it should re-run searchForMatches();
    }

    function removeBlock(block) {
        var index = blocks.indexOf(block);
        if (index >= 0) {
            blocks.splice(index, 1);
        } else {
            console.log("Trying to remove non-existing block from board");
        }
    }

    function getNextValue(value) {
        if (value < MAX_VALUE) {
            return value + 1;
        }
        return value;
    }

    function coordsAreInBoundaries(x, y) {
        return (x >= 0 && x < COLS && y >= 0 && y < ROWS + 2);
    }

    function getColHeight(col) {
        var height = 0;
        while (getBlockAt(col, height) != null) {
            height++;
        }
        return height;
    }

    function getColHeightIgnoringBlock(col, blockToIgnore) {
        var height = 0;
        while (getBlockAt(col, height) != null && getBlockAt(col, height) != blockToIgnore) {
            height++;
        }
        return height;
    }

    function getIsLost() {
        for (var i = 0; i < COLS; i++) {
            if (getColHeight(i) > ROWS) {
                return true;
            }
        }
        return false;
    }

    function clear() {
        blocks = [];
    }

    function getDump() {
        var i;
        var boardState = [];
        for (i = 0; i < COLS * ROWS; i++) {
            boardState.push(0);
        }

        for (i = 0; i < blocks.length; i++) {
            if (blocks[i].y < ROWS) {
                boardState[blocks[i].x + blocks[i].y * COLS] = blocks[i].value;
            }
        }

        return boardState;
    }

    function getCols() {
        return COLS;
    }

    function getRows() {
        return ROWS;
    }

    return {
        addBlockAt: addBlockAt,
        removeBlock: removeBlock,
        getCols: getCols,
        getRows: getRows,
        getColHeight: getColHeight,
        getColHeightIgnoringBlock: getColHeightIgnoringBlock,
        searchForMatches: searchForMatches,
        getIsLost: getIsLost,
        applyGravity: applyGravity,
        clear: clear,
        getDump: getDump
    }
};

lowfat.Block = function (x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.isChecked = false;
};

lowfat.BlockView = function (block, sprite) {
    this.block = block;
    this.sprite = sprite;
};

lowfat.LessStupidNextValueCalculator = function () {
    var PROBABILITIES = [65, 55, 34, 21, 13, 8, 5, 3, 2, 1];

    function getValue(maxUnlocked) {
        var randBoundary = getArrayElementsSumUntil(maxUnlocked);
        var randValue = Math.floor(Math.random() * randBoundary);
        for (var i = 1; i <= PROBABILITIES.length; i++) {
            if (randValue < getArrayElementsSumUntil(i)) {
                return i;
            }
        }
    }

    function getArrayElementsSumUntil(v) {
        var sum = 0;
        for (var i = 0; i < v; i++) {
            sum += PROBABILITIES[i];
        }
        return sum;
    }

    return {
        getValue: getValue
    }
};

lowfat.ScoreCalculator = function () {
    var resultingScore = 0;
    var SCORES = [10, 20, 30, 40, 50, 60, 70, 80, 300, 2500];
    var CASCADING_MULTIPLIER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    function packDropped() {
        resultingScore = 0;
    }

    function processChains(chains, cascadingLength) {
        cascadingLength += 1;
        for (var i = 0; i < chains.length; i++) {
            resultingScore += getChainScore(chains[i], cascadingLength);
        }
    }

    function getChainScore(chain, cascadingLength) {
        var sumOfScoresForEachBlock = getSumOfScoresForEachBlock(chain.chain);
        return Math.ceil(sumOfScoresForEachBlock * CASCADING_MULTIPLIER[cascadingLength - 1]);
    }

    function getSumOfScoresForEachBlock(chain) {
        var sum = 0;
        for (var i = 0; i < chain.length; i++) {
            sum += SCORES[chain[i].value - 1];
        }
        return sum;
    }

    function getResultingScore() {
        return resultingScore;
    }

    return {
        packDropped: packDropped,
        processChains: processChains,
        getChainScore: getChainScore,
        getResultingScore: getResultingScore
    }
};

lowfat.ScoreUI = function (container) {
    var scoreLabel = null;
    var highScoreLabel = null;
    var highScore = 0;
    var currentScore = 0;
    var targetScore = 0;
    var scorePerSecond = 0;
    var screenWidth = 0;

    var SECONDS_FOR_ONE_SCORE_CHANGE = 1;
    var COORDS_NORMAL_SCORE = {x: 174, y: 680};
    var SCALE_NORMAL_SCORE = 1;
    var COORDS_NORMAL_HISCORE = {x: 65, y: 707};
    var SCALE_NORMAL_HISCORE = 1;
    var COORDS_CENTERED_SCORE = {x: 174, y: 480};
    var SCALE_CENTERED_SCORE = 1.2;
    var COORDS_CENTERED_HISCORE = {x: 150, y: 390};
    var SCALE_CENTERED_HISCORE = 1.2;

    function init() {
        scoreLabel = new cc.LabelBMFont("0", res.scorefont_fnt, 250, cc.TEXT_ALIGNMENT_CENTER);
        scoreLabel.setPosition(COORDS_NORMAL_SCORE.x, COORDS_NORMAL_SCORE.y);
        scoreLabel.setScale(SCALE_NORMAL_SCORE, SCALE_NORMAL_SCORE);
        container.addChild(scoreLabel);
        highScoreLabel = new cc.LabelBMFont("0", res.highscorefont_fnt, 250, cc.TEXT_ALIGNMENT_CENTER);
        highScoreLabel.setPosition(COORDS_NORMAL_HISCORE.x, COORDS_NORMAL_HISCORE.y);
        highScoreLabel.setScale(SCALE_NORMAL_HISCORE, SCALE_NORMAL_HISCORE);
        container.addChild(highScoreLabel);
    }

    function showInitial(initialScore, initialHighScore) {
        currentScore = initialScore;
        highScore = initialHighScore;
        scoreLabel.setString(currentScore);
        highScoreLabel.setString(highScore);
    }

    function displayNewScore(value) {
        targetScore = value;
        scorePerSecond = (value - currentScore) / SECONDS_FOR_ONE_SCORE_CHANGE;
    }

    function update(dt) {
        if (currentScore < targetScore) {
            currentScore += Math.ceil(scorePerSecond * dt);
            if (currentScore >= targetScore) {
                currentScore = targetScore;
            }
            updateLabels();
        }
    }

    function updateLabels() {
        if (highScore < currentScore) {
            highScore = currentScore;
            highScoreLabel.setString(highScore);
        }
        scoreLabel.setString(currentScore);
    }

    function displayNewScoreInstantly(value) {
        currentScore = value;
        targetScore = value;
        updateLabels();
    }

    function slowlyHide() {
        var duration = 0.5;
        var scoreMoveAction = new cc.MoveTo(duration, scoreLabel.getPositionX(), 800).easing(cc.easeCubicActionOut());
        var hiScoreMoveAction = new cc.MoveTo(duration, highScoreLabel.getPositionX(), 800).easing(cc.easeCubicActionOut());
        scoreLabel.runAction(scoreMoveAction);
        highScoreLabel.runAction(hiScoreMoveAction);
    }

    function slowlyShow() {
        var duration = 0.5;
        var scoreMoveAction = new cc.MoveTo(duration, COORDS_NORMAL_SCORE.x, COORDS_NORMAL_SCORE.y).easing(cc.easeCubicActionOut());
        var hiScoreMoveAction = new cc.MoveTo(duration, screenWidth - COORDS_NORMAL_HISCORE.x - container.getPositionX(), COORDS_NORMAL_HISCORE.y).easing(cc.easeCubicActionOut());
        scoreLabel.runAction(scoreMoveAction);
        highScoreLabel.runAction(hiScoreMoveAction);
    }

    function moveToCenter() {
        var duration = 0.5;
        var scoreMoveAction = new cc.MoveTo(duration, COORDS_CENTERED_SCORE.x, COORDS_CENTERED_SCORE.y).easing(cc.easeCubicActionOut());
        var scoreScaleAction = new cc.ScaleTo(duration, SCALE_CENTERED_SCORE, SCALE_CENTERED_SCORE).easing(cc.easeCubicActionOut());
        var hiScoreMoveAction = new cc.MoveTo(duration, COORDS_CENTERED_HISCORE.x, COORDS_CENTERED_HISCORE.y).easing(cc.easeCubicActionOut());
        var hiScoreScaleAction = new cc.ScaleTo(duration, SCALE_CENTERED_HISCORE, SCALE_CENTERED_HISCORE).easing(cc.easeCubicActionOut());
        scoreLabel.runAction(new cc.Spawn(scoreMoveAction, scoreScaleAction));
        highScoreLabel.runAction(new cc.Spawn(hiScoreMoveAction, hiScoreScaleAction));
    }

    function moveToNormalPosition() {
        var duration = 0.5;
        var scoreMoveAction = new cc.MoveTo(duration, COORDS_NORMAL_SCORE.x, COORDS_NORMAL_SCORE.y).easing(cc.easeCubicActionOut());
        var scoreScaleAction = new cc.ScaleTo(duration, SCALE_NORMAL_SCORE, SCALE_NORMAL_SCORE).easing(cc.easeCubicActionOut());
        var hiScoreMoveAction = new cc.MoveTo(duration, screenWidth - COORDS_NORMAL_HISCORE.x - container.getPositionX(), COORDS_NORMAL_HISCORE.y).easing(cc.easeCubicActionOut());
        var hiScoreScaleAction = new cc.ScaleTo(duration, SCALE_NORMAL_HISCORE, SCALE_NORMAL_HISCORE).easing(cc.easeCubicActionOut());
        scoreLabel.runAction(new cc.Spawn(scoreMoveAction, scoreScaleAction));
        highScoreLabel.runAction(new cc.Spawn(hiScoreMoveAction, hiScoreScaleAction));
    }

    function reset() {
        highScore = 0;
        currentScore = 0;
        targetScore = 0;
    }

    function onResize(width) {
        screenWidth = width;
        highScoreLabel.setPosition(screenWidth - COORDS_NORMAL_HISCORE.x - container.getPositionX(), COORDS_NORMAL_HISCORE.y);
    }

    return {
        init: init,
        showInitial: showInitial,
        slowlyHide: slowlyHide,
        slowlyShow: slowlyShow,
        displayNewScore: displayNewScore,
        update: update,
        displayNewScoreInstantly: displayNewScoreInstantly,
        moveToCenter: moveToCenter,
        moveToNormalPosition: moveToNormalPosition,
        onResize: onResize,
        reset: reset
    }
};

lowfat.FloatingScore = function (container, fgContainer) {
    var pool = [];

    function show(x, y, value, cascadingLength) {
        var label = getLabelFromPoolOrCreateNew();
        var labelScale = getScaleByCascadingLength(cascadingLength);
        label.setScale(0, 0);
        label.setPosition(x + fgContainer.getPositionX(), y + fgContainer.getPositionY());
        label.isFloatingFinished = false;
        label.setString(value);
        container.addChild(label);

        var scaleInAction = new cc.ScaleTo(0.1, labelScale, labelScale).easing(cc.easeBackOut());
        var waitAction = new cc.DelayTime(0.7);
        var scaleOutAction = new cc.ScaleTo(0.2, 0, 0).easing(cc.easeCubicActionIn());
        var scaleSequence = new cc.Sequence(scaleInAction, waitAction, scaleOutAction);

        var moveByAction = new cc.MoveBy(1, 0, 50);
        var callFuncAction = new cc.CallFunc(onFloatingFinished, this, label);
        var moveSequence = new cc.Sequence(moveByAction, callFuncAction);

        label.runAction(new cc.Spawn(scaleSequence, moveSequence));
    }

    function getScaleByCascadingLength(cascadingLength) {
        return 1 + (cascadingLength - 1) / 10;
    }

    function onFloatingFinished(target, floatingLabel) {
        floatingLabel.isFloatingFinished = true;
        floatingLabel.removeFromParent();
    }

    function getLabelFromPoolOrCreateNew() {
        for (var i = 0; i < pool.length; i++) {
            if (pool[i].isFloatingFinished == true) {
                return pool[i];
            }
        }

        var label = new cc.LabelBMFont("100", res.floatingscorefont_fnt, 200, cc.TEXT_ALIGNMENT_CENTER);
        pool.push(label);
        lowfat.GraphicUtils.retain(label);
        return label;
    }

    function reset() {
        for (var i = 0; i < pool.length; i++) {
            pool[i].removeFromParent();
            pool[i].isFloatingFinished = true;
        }
    }

    return {
        show: show,
        reset: reset
    }
};

lowfat.HintUI = function (container, spriteFactory) {
    var hintIcons = [];
    var hintIconsLocked = [];
    var lastUnlockedValue = 0;

    function init(maxValue) {
        for (var i = 0; i < maxValue; i++) {
            var hintIconLocked = spriteFactory.getSprite("BlockMiniLocked", 0.5, 0.5);
            hintIconLocked.setPosition(66 + (i * 24), 21);
            hintIconLocked.setVisible(true);
            container.addChild(hintIconLocked);
            hintIconsLocked.push(hintIconLocked);

            var value = i + 1;
            var hintIcon = spriteFactory.getSprite("BlockMini" + value, 0.5, 0.5);
            hintIcon.setPosition(66 + (i * 24), 21);
            if (i > 0) {
                hintIcon.setVisible(false);
            }
            container.addChild(hintIcon);
            hintIcons.push(hintIcon);
        }
    }

    function show(maxUnlockedValue, showHighlight) {
        if (maxUnlockedValue <= lastUnlockedValue) {
            return;
        }

        lastUnlockedValue = maxUnlockedValue;
        for (var i = 0; i < hintIcons.length; i++) {
            hintIcons[i].setVisible(i <= maxUnlockedValue - 1);
            hintIconsLocked[i].setVisible(i > maxUnlockedValue - 1);
        }

        if (showHighlight && maxUnlockedValue > 1) {
            showHighlightBelowLastUnlockedIcon();
        }
    }

    function showHighlightBelowLastUnlockedIcon() {
        var lastHintIcon = hintIcons[lastUnlockedValue - 1];
        var highlight = spriteFactory.getSprite("BlockHintHighlight", 0.5, 0.5);
        var iconParent = lastHintIcon.getParent();
        iconParent.addChild(highlight);
        highlight.setPosition(lastHintIcon.getPositionX(), lastHintIcon.getPositionY());
        lowfat.GraphicUtils.putSpriteOnTop(lastHintIcon);
        highlight.setOpacity(0);

        lastHintIcon.setScale(0, 0);
        lastHintIcon.runAction(new cc.ScaleTo(0.15, 1, 1)).easing(cc.easeCubicActionIn());

        var delayAction = new cc.DelayTime(0.1);
        var fadeInAction = new cc.FadeIn(0.3);
        var pauseAction = new cc.DelayTime(1);
        var fadeOutAction = new cc.FadeOut(0.3);
        var callFuncAction = new cc.CallFunc(removeHighlight, this, highlight);
        highlight.runAction(new cc.Sequence(delayAction, fadeInAction, pauseAction, fadeOutAction, callFuncAction));
    }

    function removeHighlight(target, highlight) {
        highlight.removeFromParent();
    }

    function slowlyHide(howManyIconsToLeave) {
        var maxDelay = 0.5;
        var duration = 0.2;
        for (var i = howManyIconsToLeave; i < lastUnlockedValue; i++) {
            var hintIcon = hintIcons[i];
            hintIconsLocked[i].setVisible(true);
            var delay = maxDelay - (i * (maxDelay / (lastUnlockedValue - 1)));
            if (lastUnlockedValue == 1) {
                delay = 0;
            }
            var waitAction = new cc.DelayTime(delay);
            var disappearAction = new cc.ScaleTo(duration, 0, 0);
            if (i > 0) {
                hintIcon.runAction(new cc.Sequence(waitAction, disappearAction));
            } else {
                var callFuncAction = new cc.CallFunc(onHideFinished, this, howManyIconsToLeave);
                hintIcon.runAction(new cc.Sequence(waitAction, disappearAction, callFuncAction));
            }
        }
    }

    function slowlyHideLockedIcons() {
        var maxDelay = 0.5;
        var duration = 0.2;
        for (var i = 0; i < hintIconsLocked.length; i++) {
            var hintIconLocked = hintIconsLocked[i];
            var delay = (i * (maxDelay / (hintIconsLocked.length - 1)));
            var waitAction = new cc.DelayTime(delay);
            var disappearAction = new cc.ScaleTo(duration, 0, 0);
            if (i < hintIconsLocked.length - 1) {
                hintIconLocked.runAction(new cc.Sequence(waitAction, disappearAction));
            } else {
                var callFuncAction = new cc.CallFunc(onHideLockedFinished);
                hintIconLocked.runAction(new cc.Sequence(waitAction, disappearAction, callFuncAction));
            }
        }
    }

    function onHideLockedFinished() {
        for (var i = 0; i < hintIconsLocked.length; i++) {
            hintIconsLocked[i].setScale(1, 1);
            hintIconsLocked[i].setVisible(false);
        }
    }

    function onHideFinished(target, howManyIconsToLeave) {
        console.log("howManyIconsToLeave: " + howManyIconsToLeave);
        var start = (howManyIconsToLeave !== undefined && howManyIconsToLeave > 0) ? howManyIconsToLeave : 0;
        var i;
        for (i = start; i < hintIcons.length; i++) {
            hintIcons[i].setScale(1, 1);
            hintIcons[i].setVisible(false);
        }
        if (start == 0) {
            slowlyHideLockedIcons();
        }
    }

    function reset() {
        lastUnlockedValue = 0;
        for (var i = 0; i < hintIcons.length; i++) {
            hintIcons[i].setScale(1, 1);
            hintIcons[i].setVisible(false);
        }
    }

    return {
        init: init,
        show: show,
        slowlyHide: slowlyHide,
        reset: reset
    }
};

lowfat.TouchControls = function (movePackLeft, movePackRight, dropPack, swapPack, getInputIsLocked, getSideMenu, getScene) {
    var touchStartCoords = {x: 0, y: 0};
    var scrollLength = {x: 0, y: 0};
    var touchStarted = false;
    var atLeastOneFullSwipePerformed = false;
    var SWIPE_MIN_LENGTH = 40;

    function init() {
        addListeners();
    }

    function addListeners() {
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                processTouchStarted(touch.getLocation().x, touch.getLocation().y);
                return true;
            },
            onTouchMoved: function (touch, event) {
                processTouchUpdated(touch.getLocation().x, touch.getLocation().y, touch.getDelta())
            },
            onTouchEnded: function (touch, event) {
                processTouchEnded(touch.getLocation().x, touch.getLocation().y);
            }
        }, getScene());
    }

    function removeListeners() {
        cc.eventManager.removeListeners(cc.EventListener.TOUCH_ONE_BY_ONE);
    }

    function processTouchStarted(touchX, touchY) {
        if (getInputIsLocked() || !getSideMenu().processClickAndGetIfAllowed(touchX, touchY)) {
            return;
        }

        touchStartCoords.x = touchX;
        touchStartCoords.y = touchY;
        scrollLength.x = 0;
        scrollLength.y = 0;
        touchStarted = true;
        atLeastOneFullSwipePerformed = false;
    }

    function processTouchUpdated(touchX, touchY, delta) {
        if (touchStarted == false || getInputIsLocked()) {
            return;
        }

        scrollLength.x += delta.x;
        if (delta.y > 0) {
            scrollLength.y = 0;
        } else {
            scrollLength.y -= delta.y;
        }

        if (scrollLength.x > SWIPE_MIN_LENGTH) {
            movePackRight();
            atLeastOneFullSwipePerformed = true;
            scrollLength.x = 0;
            scrollLength.y = 0;
        }
        else if (scrollLength.x < -SWIPE_MIN_LENGTH) {
            movePackLeft();
            atLeastOneFullSwipePerformed = true;
            scrollLength.x = 0;
            scrollLength.y = 0;
        }
        else if (scrollLength.y > SWIPE_MIN_LENGTH) {
            dropPack();
        }
    }

    function processTouchEnded(touchX, touchY) {
        if (touchStarted == false || getInputIsLocked()) {
            return;
        }

        touchStarted = false;

        if (atLeastOneFullSwipePerformed == false) {
            swapPack();
        }
    }

    return {
        init: init
    }
};

lowfat.KeyboardControls = function (movePackLeft, movePackRight, dropPack, swapPack, getInputIsLocked, getScene, getBlockPreviews) {
    function init() {
        addListeners();
    }

    function addListeners() {
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function (keyCode, event) {
                if (keyCode == 37) {
                    onKeyboardLeft();
                }
                else if (keyCode == 39) {
                    onKeyboardRight();
                }
                else if (keyCode == 38) {
                    onKeyboardUp();
                }
                else if (keyCode == 40) {
                    onKeyboardDown();
                }
            }
        }, getScene());
    }

    function removeListeners() {
        cc.eventManager.removeListeners(cc.EventListener.KEYBOARD);
    }

    function onKeyboardLeft() {
        if (getInputIsLocked()) {
            return;
        }

        setPreviewsVisible(true);
        movePackLeft();
    }

    function onKeyboardRight() {
        if (getInputIsLocked()) {
            return;
        }

        setPreviewsVisible(true);
        movePackRight();
    }

    function onKeyboardUp() {
        if (getInputIsLocked()) {
            return;
        }

        swapPack();
    }

    function onKeyboardDown() {
        if (getInputIsLocked()) {
            return;
        }

        dropPack();
    }

    function setPreviewsVisible(value) {
        for (var i = 0; i < getBlockPreviews().length; i++) {
            getBlockPreviews()[i].setVisible(value);
        }
    }

    return {
        init: init
    }
};

lowfat.DesktopMouseControlsNoDrag = function (dropPack, swapPack, BLOCK_SPRITE_WIDTH, LEFT_MARGIN, COLS, ROWS,
                                              getScene, getInputIsLocked, getSideMenu, getFgContainer, pixelsToCellX, pixelsToCellY,
                                              setNextPackX, getBlockPreviews, getTopBlocks, cellToPixelsX, updateBlockPreviews) {
    var blockPositionsRelativeToCenter = [];

    function init() {
        addListeners();
    }

    function addListeners() {
        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseDown: function (event) {
                if (event.getButton() == 0) {
                    processLeftMouseDown(event.getLocationX(), event.getLocationY());
                }
                else if (event.getButton() == 2) {
                    processRightMouseDown(event.getLocationX(), event.getLocationY());
                }
            },
            onMouseMove: function (event) {
                processMouseMove(event.getLocationX(), event.getLocationY());
            },
            onMouseUp: function (event) {
                processMouseUp(event.getLocationX(), event.getLocationY());
            }
        }, getScene());
    }

    function removeListeners() {
        cc.eventManager.removeListeners(cc.EventListener.MOUSE);
    }

    function processLeftMouseDown(mouseX, mouseY) {
        if (getInputIsLocked() || !getSideMenu().processClickAndGetIfAllowed(mouseX, mouseY)) {
            return;
        }
        dropPack();
    }

    function processRightMouseDown(mouseX, mouseY) {
        if (getInputIsLocked() || !getSideMenu().processClickAndGetIfAllowed(mouseX, mouseY)) {
            return;
        }

        swapPack();
        updateBlockPreviews();
    }

    function mouseOutsideBoard(mouseX, mouseY) {
        var rX = mouseX - getFgContainer().x;
        var cellX = pixelsToCellX(rX);
        var cellY = pixelsToCellY(mouseY);
        return (cellY >= ROWS || cellY < 0 || cellX < 0 || cellX >= COLS);
    }

    function mouseOutsideBoardX(mouseX) {
        var rX = mouseX - getFgContainer().x;
        var cellX = pixelsToCellX(rX);
        return (cellX < 0 || cellX >= COLS);
    }

    function updateNextPackX(mouseX) {
        var rX = mouseX - getFgContainer().x;
        var cellX = pixelsToCellX(rX);
        cellX -= 1;
        if (cellX < 0) {
            cellX = 0;
        } else if (cellX > COLS - 2) {
            cellX = COLS - 2;
        }
        setNextPackX(cellX);
    }

    function processMouseMove(mouseX, mouseY) {
        updateNextPackX(mouseX);

        if (getInputIsLocked()) {
            return;
        }

        if (mouseOutsideBoardX(mouseX)) {
            return;
        }

        var blockSize = BLOCK_SPRITE_WIDTH;
        var suggestedRightBlockX = mouseX - getFgContainer().x - LEFT_MARGIN;
        var gridLeftX = LEFT_MARGIN;
        var gridRightX = LEFT_MARGIN + blockSize * COLS;
        var previewsDirtyFlag = false;
        blockPositionsRelativeToCenter[0] = getTopBlockPositionRelativeToCenter(0);
        blockPositionsRelativeToCenter[1] = getTopBlockPositionRelativeToCenter(1);

        for (var i = 0; i < getTopBlocks().length; i++) {
            var topBlock = getTopBlocks()[i];
            var leftMostX;
            var rightMostX;
            var blockSpriteX;
            var blockPositionRelativeToCenter = blockPositionsRelativeToCenter[i];
            if (blockPositionRelativeToCenter == 0) {
                leftMostX = gridLeftX + blockSize * 0.5;
                rightMostX = gridRightX - blockSize * 0.5;
                blockSpriteX = suggestedRightBlockX;
            }
            else if (blockPositionRelativeToCenter == -1) {
                leftMostX = gridLeftX + blockSize * 0.5;
                rightMostX = gridRightX - blockSize * 1.5;
                blockSpriteX = suggestedRightBlockX - blockSize;
            }
            else if (blockPositionRelativeToCenter == 1) {
                leftMostX = gridLeftX + blockSize * 1.5;
                rightMostX = gridRightX - blockSize * 0.5;
                blockSpriteX = suggestedRightBlockX;
            }

            if (blockSpriteX < leftMostX) {
                blockSpriteX = leftMostX;
            }
            else if (blockSpriteX > rightMostX) {
                blockSpriteX = rightMostX;
            }

            var blockCellX = pixelsToCellX(blockSpriteX);
            var oldBlockCellX = topBlock.block.x;
            if (blockCellX != oldBlockCellX) {
                topBlock.sprite.stopAllActions();
                topBlock.sprite.setPositionX(cellToPixelsX(oldBlockCellX));
                topBlock.sprite.runAction(new cc.MoveTo(0.15, cellToPixelsX(blockCellX), topBlock.sprite.getPositionY()).easing(cc.easeCubicActionOut()));
                topBlock.block.x = blockCellX;
                previewsDirtyFlag = true;
            }
        }

        if (previewsDirtyFlag == true) {
            updateBlockPreviews();
        }
    }

    function processMouseUp(mouseX, mouseY) {

    }

    function getTopBlockPositionRelativeToCenter(blockIndex) {
        var index = blockIndex == 0 ? 1 : 0;
        if (getTopBlocks()[index].block.x < getTopBlocks()[blockIndex].block.x) {
            return 1;
        }
        else if (getTopBlocks()[index].block.x > getTopBlocks()[blockIndex].block.x) {
            return -1;
        }
        return 0;
    }

    function setPreviewsVisible(value) {
        for (var i = 0; i < getBlockPreviews().length; i++) {
            getBlockPreviews()[i].setVisible(value);
        }
    }

    return {
        init: init
    }
};

lowfat.VisualEffectBackgroundHighlight = function () {
    var highlightSprite;
    var HIGHLIGHT_DURATION = 1.8;
    var FADEOUT_DURATION = 0.7;

    function init(container) {
        highlightSprite = new cc.LayerColor(cc.color(255, 255, 255));
        highlightSprite.setVisible(false);
        container.addChild(highlightSprite);
    }

    function show(value) {
        var rectAlpha = getHighlightAlpha(value);
        highlightSprite.setVisible(true);
        highlightSprite.stopAllActions();
        highlightSprite.setOpacity(rectAlpha);

        var delayAction = cc.moveBy(HIGHLIGHT_DURATION, 0, 0);
        var fadeOutAction = cc.fadeOut(FADEOUT_DURATION);
        var callFuncAction = cc.callFunc(hide);
        highlightSprite.runAction(cc.sequence(delayAction, fadeOutAction, callFuncAction));
    }

    function hide() {
        highlightSprite.setVisible(false);
    }

    function getHighlightAlpha(value) {
        var result = value * 10;
        return Math.min(result, 80);
    }

    function onResize(width, height) {
        highlightSprite.setContentSize(width, height);
    }

    return {
        init: init,
        show: show,
        hide: hide,
        onResize: onResize
    }
};

lowfat.BoardAppearAnimation = function (spriteFactory, bigGridSprite, container, cols, rows, cellSize, bottomMargin) {

    var cells = [];

    function show() {
        bigGridSprite.setVisible(false);
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var gridCell = spriteFactory.getSprite("GridCell", 0, 0);
                gridCell.setPosition(cellSize * col, cellSize * row + bottomMargin);
                container.addChild(gridCell);
                showWithDelay(gridCell, Math.random() * 0.4);
                cells.push(gridCell);
            }
        }

        var delayAction = new cc.DelayTime(1);
        var callFuncAction = new cc.CallFunc(removeAllCellsAndShowBigGrid);
        cells[0].runAction(new cc.Sequence(delayAction, callFuncAction));
    }

    function removeAllCellsAndShowBigGrid() {
        for (var i = 0; i < cells.length; i++) {
            cells[i].removeFromParent();
        }
        cells = [];
        bigGridSprite.setVisible(true);
    }

    function showWithDelay(gridCell, delay) {
        gridCell.setOpacity(0);
        var delayAction = new cc.DelayTime(delay);
        var fadeInAction = new cc.FadeIn(0.4);
        // todo: maybe add some tween?
        gridCell.runAction(new cc.Sequence(delayAction, fadeInAction));
    }

    return {
        show:show
    }
};

lowfat.FuseTracking = function (analyticsManager) {
    var firstDropMade = false;

    function processDrop() {
        if (!firstDropMade) {
            firstDropMade = true;
            analyticsManager.sendEvent(lowfat.analyticsEvents.CATEGORY_GENERAL, lowfat.analyticsEvents.FIRST_DROP_MADE);
        }
    }

    function processRestartDuringGame() {
        analyticsManager.sendEvent(lowfat.analyticsEvents.CATEGORY_GENERAL, lowfat.analyticsEvents.RESTART_DURING_GAME);
    }

    function processRestartAfterGameEnd() {
        analyticsManager.sendEvent(lowfat.analyticsEvents.CATEGORY_GENERAL, lowfat.analyticsEvents.RESTART_AFTER_GAME_END);
    }

    function processGameLost() {
        analyticsManager.sendEvent(lowfat.analyticsEvents.CATEGORY_GENERAL, lowfat.analyticsEvents.GAME_LOST);
    }

    function processTutorialFinished() {
        analyticsManager.sendEvent(lowfat.analyticsEvents.CATEGORY_TUTORIAL, lowfat.analyticsEvents.TUTORIAL_FINISHED);
    }

    return {
        processDrop: processDrop,
        processRestartDuringGame: processRestartDuringGame,
        processRestartAfterGameEnd: processRestartAfterGameEnd,
        processGameLost: processGameLost,
        processTutorialFinished: processTutorialFinished
    }
};