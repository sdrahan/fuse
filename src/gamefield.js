var GamefieldScene = cc.Scene.extend({

    COLS: 6,
    ROWS: 7,
    MAX_VALUE: 10,
    BLOCK_SPRITE_WIDTH: 58,
    BOTTOM_MARGIN: 40,
    LEFT_MARGIN: 0,
    PACK_Y: 7,
    PACK_LENGTH: 2,
    DEFAULT_PACK_X: 2,
    BLOCK_FALL_SPEED_DROP: 0.05,
    BLOCK_FALL_SPEED_GRAVITY: 0.05,
    BLOCK_MERGE_DURATION: 0.05,
    BLOCK_FALL_CELL_DURATION: 0.08,
    MINIATURES_Y: 582,
    MINIATURES_SCALE: 0.5,

    bgSprite: null,
    bgLeftSprite: null,
    bgRightSprite: null,
    fgContainer: null,
    uiContainer: null,
    board: null,
    blocks: [],
    topBlocks: [],
    nextPackMiniatures: [],
    blockPreviews: [],
    currentPack: null,
    nextPack: null,
    maxUnlockedValue: 1,
    touchStarted: false,
    inputIsLocked: true,
    nextPackX: 2,
    actionsToFinish: 0,
    blockValueGenerator: null,
    cascadingLength: 0,
    scoreCalculator: null,
    scoreUI: null,
    score: 0,
    hintUI: null,
    controlSchemes: null,
    gameStateModel: null,
    ingameUI: null,
    sideMenu: null,
    floatingScore: null,
    grid: null,
    flashEffect: null,
    bgParticles: null,

    initVars: function () {
        this.fgContainer = null;
        this.board = null;
        this.gameStateModel = lowfat.GameStateModel;
    },

    setup: function () {
        this.initVars();
        this.initLayers();
        this.initBoard();
        this.initControls();
        this.initFromGameState();
        this.initTutorial();
        this.createNewPack();
        this.scheduleUpdate();
        this.onResize();
    },

    initLayers: function () {
        this.bgSprite = lowfat.GameSpriteManager.getSprite("Bg", 0, 0);
        this.addChild(this.bgSprite);
        this.bgLeftSprite = lowfat.GameSpriteManager.getSprite("BgLeft", 0, 0);
        this.addChild(this.bgLeftSprite);
        this.bgRightSprite = lowfat.GameSpriteManager.getSprite("BgRight", 1, 0);
        this.addChild(this.bgRightSprite);
        this.bgParticles = new cc.ParticleSystem(gameBgParticlesConfig);
        this.addChild(this.bgParticles);
        this.flashEffect = new VisualEffectBackgroundHighlight(300, 300);
        this.flashEffect.init(this);
        this.fgContainer = new cc.Node();
        this.addChild(this.fgContainer);
        this.uiContainer = new cc.Node();
        this.addChild(this.uiContainer);
        this.grid = lowfat.GameSpriteManager.getSprite("Grid", 0, 0);
        this.fgContainer.addChild(this.grid);
        this.grid.setPosition(0, this.BOTTOM_MARGIN);
        this.scoreUI = new ScoreUI(this.fgContainer);
        this.scoreUI.init();
        this.hintUI = new HintUI(this.fgContainer);
        this.hintUI.init(this.MAX_VALUE);
        this.ingameUI = new IngameUI(this);
        this.ingameUI.init(this.uiContainer);
        this.floatingScore = new FloatingScore(this.uiContainer, this.fgContainer);

        this.sideMenu = new lowfat.SideMenu(this);
        this.sideMenu.init(this.uiContainer);
    },

    initBoard: function () {
        this.board = new GameBoard(this, this.COLS, this.ROWS, this.MAX_VALUE);
        this.blockValueGenerator = new LessStupidNextValueCalculator();
        this.scoreCalculator = new ScoreCalculator();

        // 6 cascading. SIX!
        // this.createBlockView(this.board.addBlockAt(0, 0, 7));
        // this.createBlockView(this.board.addBlockAt(1, 0, 4));
        // this.createBlockView(this.board.addBlockAt(2, 0, 2));
        // this.createBlockView(this.board.addBlockAt(3, 0, 6));
        // this.createBlockView(this.board.addBlockAt(4, 0, 6));
        // this.createBlockView(this.board.addBlockAt(5, 0, 1));
        //
        // this.createBlockView(this.board.addBlockAt(0, 1, 5));
        // this.createBlockView(this.board.addBlockAt(1, 1, 1));
        // this.createBlockView(this.board.addBlockAt(2, 1, 6));
        // this.createBlockView(this.board.addBlockAt(3, 1, 7));
        // this.createBlockView(this.board.addBlockAt(4, 1, 5));
        // this.createBlockView(this.board.addBlockAt(5, 1, 2));
        //
        // this.createBlockView(this.board.addBlockAt(0, 2, 1));
        // this.createBlockView(this.board.addBlockAt(1, 2, 4));
        // this.createBlockView(this.board.addBlockAt(2, 2, 6));
        // this.createBlockView(this.board.addBlockAt(3, 2, 7));
        // this.createBlockView(this.board.addBlockAt(4, 2, 5));
        // this.createBlockView(this.board.addBlockAt(5, 2, 6));
        //
        // this.createBlockView(this.board.addBlockAt(0, 3, 5));
        // this.createBlockView(this.board.addBlockAt(1, 3, 4));
        // this.createBlockView(this.board.addBlockAt(2, 3, 8));
        // this.createBlockView(this.board.addBlockAt(3, 3, 2));
        // this.createBlockView(this.board.addBlockAt(4, 3, 4));
        // this.createBlockView(this.board.addBlockAt(5, 3, 3));
        //
        // this.createBlockView(this.board.addBlockAt(0, 4, 1));
        // this.createBlockView(this.board.addBlockAt(1, 4, 3));
        // this.createBlockView(this.board.addBlockAt(2, 4, 8));
        // this.createBlockView(this.board.addBlockAt(3, 4, 5));
        // this.createBlockView(this.board.addBlockAt(4, 4, 4));
        // this.createBlockView(this.board.addBlockAt(5, 4, 3));
        //
        // this.createBlockView(this.board.addBlockAt(1, 5, 3));
        // this.createBlockView(this.board.addBlockAt(5, 5, 2));
        //
        // this.createBlockView(this.board.addBlockAt(5, 6, 2));
        //
        // this.currentPack = [2, 1];
        // this.nextPack = [1, 1];
        //
        // this.score = 11060;
        // this.scoreUI.displayNewScoreInstantly(0);
        // this.maxUnlockedValue = 8;

        // Two black blocks:
        // this.createBlockView(this.board.addBlockAt(0, 0, 9));
        // this.createBlockView(this.board.addBlockAt(0, 1, 8));
        // this.createBlockView(this.board.addBlockAt(0, 2, 7));
        // this.createBlockView(this.board.addBlockAt(0, 3, 6));
        // this.createBlockView(this.board.addBlockAt(0, 4, 5));
        // this.createBlockView(this.board.addBlockAt(0, 5, 4));
        // this.createBlockView(this.board.addBlockAt(0, 6, 3));
        //
        // this.createBlockView(this.board.addBlockAt(1, 0, 5));
        // this.createBlockView(this.board.addBlockAt(1, 1, 1));
        // this.createBlockView(this.board.addBlockAt(1, 2, 2));
        // this.createBlockView(this.board.addBlockAt(1, 3, 8));
        // this.createBlockView(this.board.addBlockAt(1, 4, 6));
        // this.createBlockView(this.board.addBlockAt(1, 5, 6));
        // this.createBlockView(this.board.addBlockAt(1, 6, 4));
        //
        // this.createBlockView(this.board.addBlockAt(2, 0, 3));
        // this.createBlockView(this.board.addBlockAt(2, 1, 4));
        // this.createBlockView(this.board.addBlockAt(2, 2, 1));
        // this.createBlockView(this.board.addBlockAt(2, 3, 4));
        // this.createBlockView(this.board.addBlockAt(2, 4, 10));
        // this.createBlockView(this.board.addBlockAt(2, 5, 3));
        // this.createBlockView(this.board.addBlockAt(2, 6, 9));
        //
        // this.createBlockView(this.board.addBlockAt(3, 0, 1));
        // this.createBlockView(this.board.addBlockAt(3, 1, 2));
        // this.createBlockView(this.board.addBlockAt(3, 2, 3));
        // this.createBlockView(this.board.addBlockAt(3, 3, 6));
        // this.createBlockView(this.board.addBlockAt(3, 4, 10));
        //
        // this.createBlockView(this.board.addBlockAt(4, 0, 8));
        // this.createBlockView(this.board.addBlockAt(4, 1, 9));
        // this.createBlockView(this.board.addBlockAt(4, 2, 2));
        // this.createBlockView(this.board.addBlockAt(4, 3, 3));
        //
        // this.createBlockView(this.board.addBlockAt(5, 0, 2));
        // this.createBlockView(this.board.addBlockAt(5, 1, 1));
        // this.createBlockView(this.board.addBlockAt(5, 2, 9));
        // this.createBlockView(this.board.addBlockAt(5, 3, 7));
        // this.createBlockView(this.board.addBlockAt(5, 4, 10));
        // this.createBlockView(this.board.addBlockAt(5, 5, 2));
        // this.createBlockView(this.board.addBlockAt(5, 6, 6));
        //
        // this.maxUnlockedValue = 10;
    },

    initControls: function () {
        this.controlSchemes = [];
        if (cc.sys.isMobile) {
            this.controlSchemes.push(new TouchControls(this));
        } else {
            this.controlSchemes.push(new KeyboardControls(this));
            this.controlSchemes.push(new DesktopMouseControlsNoDrag(this));
        }

        for (var i = 0; i < this.controlSchemes.length; i++) {
            this.controlSchemes[i].init();
        }
    },

    initFromGameState: function () {
        this.currentPack = this.gameStateModel.pack.length > 0 ? this.gameStateModel.pack : null;
        this.nextPack = this.gameStateModel.nextPack.length > 0 ? this.gameStateModel.nextPack : null;
        this.score = this.gameStateModel.score;

        this.scoreUI.showInitial(this.score, this.gameStateModel.highScore);

        var boardState = this.gameStateModel.boardState;
        for (var i = 0; i < boardState.length; i++) {
            if (boardState[i] > 0) {
                var col = i % this.COLS;
                var row = Math.floor(i / this.COLS);
                this.createBlockView(this.board.addBlockAt(col, row, boardState[i]));
                if (boardState[i] > this.maxUnlockedValue) {
                    this.maxUnlockedValue = boardState[i];
                }
            }
        }
        this.hintUI.show(this.maxUnlockedValue, false);
    },

    initTutorial: function () {
        this.tutorial = new Tutorial();
        if (this.gameStateModel.isTutorialFinished == false || this.gameStateModel.isFirstGame) {
            this.tutorial.init(this, this.uiContainer, cc.sys.isMobile, this.gameStateModel);
        }
    },

    createNewPack: function () {
        var animationIsNeeded = true;
        if (this.currentPack == null) {
            if (this.nextPack != null) {
                this.currentPack = this.nextPack;
            }
            else {
                this.currentPack = this.generatePackValues();
                animationIsNeeded = false;
            }
            this.nextPack = this.generatePackValues();
        }

        this.removeNextPackMiniatureIfAny();
        this.createNextPackMiniature();

        this.topBlocks = [];
        for (var i = 0; i < this.currentPack.length; i++) {
            var block = this.board.addBlockAt(this.nextPackX + i, this.PACK_Y, this.currentPack[i]);
            var blockView = this.createBlockView(block);
            this.topBlocks.push(blockView);
        }
        this.nextPackX = this.DEFAULT_PACK_X;

        this.createPreviews();
        this.updateTopBlocksPosition();

        if (animationIsNeeded) {
            this.displayTopBlocksFromMiniatureToNormalAnimation();
            this.displayTopBlocksMiniatureAppearingAnimation();
        } else {
            this.topBlocks[0].sprite.setScale(0, 0);
            this.topBlocks[0].sprite.runAction(new cc.ScaleTo(0.2, 1, 1)).easing(cc.easeBackOut());
            this.topBlocks[1].sprite.setScale(0, 0);
            this.topBlocks[1].sprite.runAction(new cc.Sequence(new cc.ScaleTo(0.2, 1, 1).easing(cc.easeBackOut()), new cc.CallFunc(this.unlockInput, this)));
        }
    },

    removeNextPackMiniatureIfAny: function () {
        for (var i = 0; i < this.nextPackMiniatures.length; i++) {
            this.nextPackMiniatures[i].removeFromParent();
        }
        this.nextPackMiniatures = [];
    },

    createNextPackMiniature: function () {
        var boardCenterX = this.getBoardCenterX();
        var miniatureWidth = this.BLOCK_SPRITE_WIDTH * this.MINIATURES_SCALE;

        var minA = this.getBlockSprite(this.nextPack[0]);
        var minB = this.getBlockSprite(this.nextPack[1]);
        minA.setScale(this.MINIATURES_SCALE, this.MINIATURES_SCALE);
        minB.setScale(this.MINIATURES_SCALE, this.MINIATURES_SCALE);
        this.fgContainer.addChild(minA);
        this.fgContainer.addChild(minB);
        minA.setPosition(boardCenterX - miniatureWidth / 2, this.MINIATURES_Y);
        minB.setPosition(boardCenterX + miniatureWidth / 2, this.MINIATURES_Y);
        this.nextPackMiniatures.push(minA);
        this.nextPackMiniatures.push(minB);
    },

    displayTopBlocksMiniatureAppearingAnimation: function () {
        for (var i = 0; i < this.nextPackMiniatures.length; i++) {
            this.nextPackMiniatures[i].setScale(0, 0);
            var delayAction = new cc.DelayTime(0.4);
            var scaleInAction = new cc.ScaleTo(0.15, this.MINIATURES_SCALE, this.MINIATURES_SCALE).easing(cc.easeBackOut());
            this.nextPackMiniatures[i].runAction(new cc.Sequence(delayAction, scaleInAction));
        }
    },

    displayTopBlocksFromMiniatureToNormalAnimation: function () {
        var boardCenterX = this.getBoardCenterX();
        var miniatureWidth = this.BLOCK_SPRITE_WIDTH * this.MINIATURES_SCALE;
        var spriteA = this.topBlocks[0].sprite;
        var spriteB = this.topBlocks[1].sprite;
        spriteA.setScale(this.MINIATURES_SCALE, this.MINIATURES_SCALE);
        spriteB.setScale(this.MINIATURES_SCALE, this.MINIATURES_SCALE);
        spriteA.setPosition(boardCenterX - miniatureWidth / 2, this.MINIATURES_Y);
        spriteB.setPosition(boardCenterX + miniatureWidth / 2, this.MINIATURES_Y);
        var toXA = this.cellToPixelsX(this.topBlocks[0].block.x);
        var toYA = this.cellToPixelsY(this.topBlocks[0].block.y);
        var toXB = this.cellToPixelsX(this.topBlocks[1].block.x);
        var toYB = this.cellToPixelsY(this.topBlocks[1].block.y);
        var duration = 0.15;
        var spawnA = new cc.Spawn(new cc.ScaleTo(duration, 1, 1).easing(cc.easeCubicActionIn()), new cc.MoveTo(duration, toXA, toYA).easing(cc.easeCubicActionIn()));
        var spawnB = new cc.Spawn(new cc.ScaleTo(duration, 1, 1).easing(cc.easeCubicActionIn()), new cc.MoveTo(duration, toXB, toYB).easing(cc.easeCubicActionIn()));
        var callFuncAction = new cc.CallFunc(this.unlockInput, this);
        spriteA.runAction(spawnA);
        spriteB.runAction(new cc.Sequence(spawnB, callFuncAction));
    },

    generatePackValues: function () {
        var packLength = this.PACK_LENGTH;
        var packValues = [];
        for (var i = 0; i < packLength; i++) {
            var value = this.blockValueGenerator.getValue(this.maxUnlockedValue);
            packValues.push(value);
        }
        return packValues;
    },

    createPreviews: function () {
        for (var i = 0; i < this.currentPack.length; i++) {
            if (this.blockPreviews.length <= i) {
                var blockPreview = lowfat.GameSpriteManager.getSprite("BlockMini" + this.currentPack[i]);
                this.fgContainer.addChild(blockPreview);
                this.blockPreviews.push(blockPreview);
            }
            this.blockPreviews[i].setVisible(true);
        }

        this.updateBlockPreviews();
    },

    removePreviews: function () {
        for (var i = 0; i < this.blockPreviews.length; i++) {
            this.blockPreviews[i].removeFromParent();
        }
        this.blockPreviews = [];
    },

    removeTopBlocks: function () {
        this.currentPack = null;
        this.nextPack = null;
        for (var i = 0; i < this.topBlocks.length; i++) {
            this.board.removeBlock(this.topBlocks[i].block);
            this.removeBlockView(this.topBlocks[i]);
        }
        this.topBlocks = [];
        this.removePreviews();
        this.removeNextPackMiniatureIfAny();
    },

    movePackLeft: function () {
        if (this.inputIsLocked) {
            return;
        }

        var i;
        for (i = 0; i < this.topBlocks.length; i++) {
            if (this.topBlocks[i].block.x <= 0) {
                return;
            }
        }

        for (i = 0; i < this.topBlocks.length; i++) {
            this.topBlocks[i].sprite.stopAllActions();
            this.topBlocks[i].sprite.setPositionX(this.cellToPixelsX(this.topBlocks[i].block.x));
            this.topBlocks[i].block.x -= 1;
            this.topBlocks[i].sprite.runAction(new cc.MoveTo(0.15, this.cellToPixelsX(this.topBlocks[i].block.x), this.topBlocks[i].sprite.getPositionY()).easing(cc.easeCubicActionOut()));
        }

        this.updateBlockPreviews();
        lowfat.SoundManager.playMusic();
        this.tutorial.processSwipe();
    },

    movePackRight: function () {
        if (this.inputIsLocked) {
            return;
        }

        var i;
        for (i = 0; i < this.topBlocks.length; i++) {
            if (this.topBlocks[i].block.x >= this.board.COLS - 1) {
                return;
            }
        }

        for (i = 0; i < this.topBlocks.length; i++) {
            this.topBlocks[i].sprite.stopAllActions();
            this.topBlocks[i].sprite.setPositionX(this.cellToPixelsX(this.topBlocks[i].block.x));
            this.topBlocks[i].block.x += 1;
            this.topBlocks[i].sprite.runAction(new cc.MoveTo(0.15, this.cellToPixelsX(this.topBlocks[i].block.x), this.topBlocks[i].sprite.getPositionY()).easing(cc.easeCubicActionOut()));
        }

        this.updateBlockPreviews();
        lowfat.SoundManager.playMusic();
        this.tutorial.processSwipe();
    },

    swapPack: function () {
        if (this.inputIsLocked) {
            return;
        }

        var blockAView = this.topBlocks[0];
        var blockA = blockAView.block;
        var blockBView = this.topBlocks[1];
        var blockB = blockBView.block;
        var blockAOldCoords = {x: blockA.x, y: blockA.y};
        var blockBOldCoords = {x: blockB.x, y: blockB.y};

        if (blockA.y == this.PACK_Y && blockB.y == this.PACK_Y) {
            if (blockA.x < blockB.x) {
                blockA.x = blockB.x;
                blockB.y = this.PACK_Y + 1;
            } else {
                blockB.x = blockA.x;
                blockA.y = this.PACK_Y + 1;
            }
        }
        else if (blockA.y > this.PACK_Y) {
            blockA.y = this.PACK_Y;
            if (blockA.x > 0) {
                blockA.x -= 1;
            } else {
                blockB.x += 1;
            }
        }
        else if (blockB.y > this.PACK_Y) {
            blockB.y = this.PACK_Y;
            if (blockB.x > 0) {
                blockB.x -= 1;
            } else {
                blockA.x += 1;
            }
        }
        else {
            cc.warn("swapPack - wrong blocks state")
        }

        this.updateBlockPreviews();
        var swapDuration = 0.1;
        blockAView.sprite.stopAllActions();
        blockAView.sprite.setPosition(this.cellToPixelsX(blockAOldCoords.x), this.cellToPixelsY(blockAOldCoords.y));
        blockBView.sprite.stopAllActions();
        blockBView.sprite.setPosition(this.cellToPixelsX(blockBOldCoords.x), this.cellToPixelsY(blockBOldCoords.y));
        blockAView.sprite.runAction(new cc.MoveTo(swapDuration, this.cellToPixelsX(blockA.x), this.cellToPixelsY(blockA.y)));
        blockBView.sprite.runAction(new cc.MoveTo(swapDuration, this.cellToPixelsX(blockB.x), this.cellToPixelsY(blockB.y)));

        this.inputIsLocked = true;
        lowfat.SoundManager.playMusic();
        lowfat.SoundManager.playSwapSound();
        this.callFunctionAfterDelay(swapDuration, this.unlockInput, this);
        this.tutorial.processSwap();
    },

    unlockInput: function () {
        this.inputIsLocked = false;
    },

    updateBlockPreviews: function () {
        for (var i = 0; i < this.topBlocks.length; i++) {
            var previewX = this.topBlocks[i].block.x;
            var colHeight = this.board.getColHeight(previewX);
            var previewY = this.topBlocks[i].block.y > this.PACK_Y ? colHeight + 1 : colHeight;
            var previewXPixels = this.cellToPixelsX(previewX);
            var previewYPixels = this.cellToPixelsY(previewY);
            this.blockPreviews[i].setPosition(previewXPixels, previewYPixels);
        }
    },

    updateTopBlocksPosition: function () {
        for (var i = 0; i < this.topBlocks.length; i++) {
            this.topBlocks[i].sprite.stopAllActions();
            this.topBlocks[i].sprite.setScale(1, 1);
            this.updateBlockViewPosition(this.topBlocks[i]);
        }
    },

    dropPack: function () {
        if (this.inputIsLocked) {
            return;
        }

        this.preDropActions();
        this.updateTopBlocksPosition();

        var biggestTime = 0;
        for (var i = 0; i < this.topBlocks.length; i++) {
            var topBlock = this.topBlocks[i];
            var toX = topBlock.block.x;
            var toY = this.board.getColHeight(toX);
            var distance = topBlock.block.y - toY;
            var secondsPerCell = this.BLOCK_FALL_CELL_DURATION;
            var time = secondsPerCell * distance;
            if (time > biggestTime) {
                biggestTime = time;
            }
            var moveAction = cc.moveTo(time, this.cellToPixelsX(toX), this.cellToPixelsY(toY)).easing(cc.easeCubicActionIn());
            topBlock.sprite.runAction(moveAction);
            topBlock.block.x = toX;
            topBlock.block.y = toY;
        }

        this.callFunctionAfterDelay(biggestTime, this.dropPackFinished, this);
    },

    preDropActions: function () {
        this.inputIsLocked = true;

        lowfat.SoundManager.playDropSound();
        lowfat.SoundManager.playMusic();

        if (this.topBlocks[0].block.y > this.topBlocks[1].block.y) {
            this.topBlocks.push(this.topBlocks[0]);
            this.topBlocks.splice(0, 1);
        }

        this.removePreviews();
        this.currentPack = null;
        this.tutorial.processDrop();
    },

    dropPackFinished: function () {
        this.tutorial.processDropFinished();
        this.cascadingLength = 0;
        this.topBlocks = [];
        this.actionsToFinish = 0;
        this.scoreCalculator.packDropped();
        this.board.searchForMatches();
    },

    callFunctionAfterDelay: function (delay, callback, callbackContext, params) {
        var waitAction = new cc.DelayTime(delay);
        var callFuncAction = new cc.CallFunc(callback, callbackContext, params);
        this.runAction(new cc.Sequence(waitAction, callFuncAction));
    },

    onNoMatchesFoundWithDelay: function () {
        this.callFunctionAfterDelay(0.1, this.onNoMatchesFound, this);
    },

    onNoMatchesFound: function () {
        this.score += this.scoreCalculator.getResultingScore();
        this.gameStateModel.currentScore += this.scoreCalculator.getResultingScore();
        this.scoreUI.displayNewScore(this.score);

        var isLost = this.board.getIsLost();
        if (isLost) {
            this.processGameLost();
        } else {
            this.createNewPack();
            this.saveGameState();
        }
    },

    processChainMergesWithDelay: function (merges) {
        this.callFunctionAfterDelay(0.1, this.processChainMergesAdapter, this, merges);
    },

    processChainMergesAdapter: function (target, merges) {
        this.processChainMerges(merges);
    },

    processChainMerges: function (merges) {
        this.cascadingLength += 1;
        if (this.cascadingLength > 1) {
            this.flashEffect.show(this.cascadingLength - 1);
        }
        lowfat.SoundManager.playMatchSound(this.cascadingLength);
        this.scoreCalculator.processChains(merges, this.cascadingLength);
        this.hintUI.show(this.maxUnlockedValue, true);
        for (var i = 0; i < merges.length; i++) {
            this.processChainMerge(merges[i]);
        }
        this.board.applyGravity();
    },

    processChainMerge: function (merge) {
        // {chain: chain, resultingBlock: block};
        this.actionsToFinish += merge.chain.length;
        for (var i = 0; i < merge.chain.length; i++) {
            this.showMergingBlock(this.getBlockViewByModel(merge.chain[i]), merge.resultingBlock);
        }
        this.showBlockCreateDuringMerge(merge.resultingBlock);

        this.floatingScore.show(this.cellToPixelsX(merge.resultingBlock.x),
            this.cellToPixelsY(merge.resultingBlock.y),
            this.scoreCalculator.getChainScore(merge, this.cascadingLength),
            this.cascadingLength);

        if (merge.chain[0].value == this.MAX_VALUE) {
            this.maxUnlockedValue = 1;
            this.hintUI.slowlyHide(1);
        }
    },

    showMergingBlock: function (blockView, resultingBlock) {
        lowfat.GraphicUtils.putSpriteOnTop(blockView.sprite);

        var oldX = blockView.block.x;
        var oldY = blockView.block.y;
        var diffX = Math.abs(resultingBlock.x - oldX);
        var diffY = Math.abs(resultingBlock.y - oldY);
        var newX = this.cellToPixelsX(resultingBlock.x);
        var newY = this.cellToPixelsY(resultingBlock.y);

        var callbackAction = new cc.CallFunc(this.blockMergeFinished, this, blockView);

        var upScaleAction = new cc.ScaleTo(0.1, 1.1, 1.1).easing(cc.easeCubicActionOut());
        var waitAction = new cc.DelayTime(0.15);
        var moveAction = new cc.MoveTo(0.25, newX, newY).easing(cc.easeQuarticActionIn());
        var scaleDownAction = new cc.ScaleBy(0.25, diffY > 0 ? 0.05 : 0.2, diffX > 0 ? 0.05 : 0.2).easing(cc.easeQuadraticActionOut());

        var spawn = new cc.Spawn(moveAction, scaleDownAction);
        var upSequence = new cc.Sequence(upScaleAction, waitAction);
        var mainSequence = new cc.Sequence(upSequence, spawn);

        blockView.sprite.runAction(new cc.Sequence(mainSequence, callbackAction));
    },

    blockMergeFinished: function (target, blockView) {
        this.removeBlockView(blockView);
        this.actionFinished();
    },

    showBlockCreateDuringMerge: function (resultingBlock) {
        this.actionsToFinish += 1;
        var blockView = this.createBlockView(resultingBlock);
        var blockSprite = blockView.sprite;
        blockSprite.setScale(0, 0);
        var delayAction = new cc.DelayTime(0.3);
        var scaleUpAction = new cc.ScaleTo(0.3, 1, 1).easing(cc.easeCubicActionIn());
        var callFuncAction = new cc.CallFunc(this.actionFinished, this);
        blockSprite.runAction(new cc.Sequence(delayAction, scaleUpAction, callFuncAction));
    },

    showFallingBlocks: function (fallingBlocks) {
        // {block: blockOnTop, fromY: blockOnTop.y, toY: row};
        this.actionsToFinish += fallingBlocks.length;
        for (var i = 0; i < fallingBlocks.length; i++) {
            this.showFallingBlock(fallingBlocks[i]);
        }
    },

    showFallingBlock: function (fallingBlockInfo) {
        var delay = 0.55;
        var block = fallingBlockInfo.block;
        var blockView = this.getBlockViewByModel(block);
        var newX = this.cellToPixelsX(block.x);
        var newY = this.cellToPixelsY(block.y);
        var duration = (fallingBlockInfo.fromY - fallingBlockInfo.toY) * this.BLOCK_FALL_CELL_DURATION;
        var delayAction = new cc.DelayTime(delay);
        var moveAction = new cc.MoveTo(duration, newX, newY).easing(cc.easeCubicActionIn());
        var callbackAction = new cc.CallFunc(this.blockFallFinished, this);
        blockView.sprite.runAction(new cc.Sequence(delayAction, moveAction, callbackAction));
    },

    blockFallFinished: function () {
        this.actionFinished();
    },

    actionFinished: function () {
        this.actionsToFinish -= 1;
        if (this.actionsToFinish <= 0) {
            if (this.actionsToFinish < 0) {
                cc.warn("this.actionsToFinish < 0; Why?");
            }
            this.runAction(new cc.Sequence(new cc.DelayTime(0.5), new cc.CallFunc(this.board.searchForMatches, this.board)));
        }
    },

    update: function (dt) {
        this.scoreUI.update(dt);
    },

    processRestartDuringGame: function () {
        this.inputIsLocked = true;
        this.ingameUI.setEnabled(false);
        this.sideMenu.setMenuAvailable(false);
        this.stopAllActions();
        this.removeTopBlocks();
        this.saveGameLostGameState();
        this.showLostAnimation(this.onRestartAnimationFinished);
    },

    processGameLost: function () {
        this.inputIsLocked = true;
        this.ingameUI.setRetryButtonVisible(false);
        this.sideMenu.setMenuAvailable(false);
        this.stopAllActions();
        this.board.clear();
        this.saveGameLostGameState();
        this.removeTopBlocks();
        this.showLostAnimation(this.onLostAnimationFinished);
    },

    processNewGame: function () {
        this.grid.runAction(new cc.FadeIn(0.1));
        this.ingameUI.setRetryButtonVisible(true);
        this.sideMenu.setMenuAvailable(true);
        this.restart();
    },

    restart: function () {
        this.removeAllBlockModelsAndViews();
        this.board.clear();

        this.currentPack = null;
        this.nextPack = null;

        this.score = 0;
        this.scoreUI.reset();
        this.scoreUI.showInitial(this.score, this.gameStateModel.highScore);

        this.nextPackX = this.DEFAULT_PACK_X;
        this.maxUnlockedValue = 1;
        this.hintUI.reset();
        this.hintUI.show(this.maxUnlockedValue, false);

        this.createNewPack();

        this.ingameUI.setEnabled(true);
        this.sideMenu.setMenuAvailable(true);
    },

    showLostAnimation: function (callback) {
        this.hintUI.slowlyHide(0);

        var columns = [];
        var i;

        for (i = 0; i < this.COLS; i++) {
            var columnContainer = new cc.Node();
            this.fgContainer.addChild(columnContainer);
            columns.push(columnContainer);
        }

        for (i = 0; i < this.blocks.length; i++) {
            var block = this.blocks[i];
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

        this.callFunctionAfterDelay(biggestDelayDuration + fallDuration, callback, this, columns);
    },

    onRestartAnimationFinished: function (target, columns) {
        this.removeBlocksAndLostAnimationColumns(columns);
        this.restart();
    },

    onLostAnimationFinished: function (target, columns) {
        this.removeBlocksAndLostAnimationColumns(columns);
        this.grid.runAction(new cc.FadeOut(0.1));
        this.scoreUI.moveToCenter();
        this.ingameUI.showPostGameButtons();
    },

    removeBlocksAndLostAnimationColumns: function (columns) {
        this.removeAllBlockModelsAndViews();
        for (var i = 0; i < columns.length; i++) {
            columns[i].removeFromParent();
        }
    },

    createBlockView: function (blockModel) {
        var blockSprite = this.getBlockSprite(blockModel.value);
        var blockView = new BlockView(blockModel, blockSprite);
        this.updateBlockViewPosition(blockView);
        this.fgContainer.addChild(blockView.sprite);
        this.blocks.push(blockView);
        return blockView;
    },

    updateBlockViewPosition: function (blockView) {
        blockView.sprite.setPosition(this.cellToPixelsX(blockView.block.x), this.cellToPixelsY(blockView.block.y));
    },

    removeBlockView: function (blockView) {
        var index = this.blocks.indexOf(blockView);
        if (index < 0) {
            console.log("Trying to remove non-existing block view");
            return;
        }
        this.blocks[index].sprite.removeFromParent();
        this.blocks.splice(index, 1);
    },

    getBlockSprite: function (value) {
        var blockSprite = lowfat.GameSpriteManager.getSprite("Block" + value.toString());
        return blockSprite;
    },

    getBlockViewByModel: function (block) {
        for (var i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i].block == block) {
                return this.blocks[i];
            }
        }
        return null;
    },

    cellToPixelsX: function (cell) {
        return cell * this.BLOCK_SPRITE_WIDTH + (this.BLOCK_SPRITE_WIDTH / 2) + this.LEFT_MARGIN;
    },

    cellToPixelsY: function (cell) {
        return cell * this.BLOCK_SPRITE_WIDTH + (this.BLOCK_SPRITE_WIDTH / 2) + this.BOTTOM_MARGIN;
    },

    pixelsToCellX: function (pixels) {
        return Math.floor((pixels - this.LEFT_MARGIN) / this.BLOCK_SPRITE_WIDTH);
    },

    pixelsToCellY: function (pixels) {
        return Math.floor((pixels - this.BOTTOM_MARGIN) / this.BLOCK_SPRITE_WIDTH);
    },

    getBoardCenterX: function () {
        return this.LEFT_MARGIN + (this.BLOCK_SPRITE_WIDTH * this.COLS) / 2;
    },

    onResize: function () {
        var winSize = cc.director.getWinSize();
        var boardViewWidth = this.COLS * this.BLOCK_SPRITE_WIDTH + this.LEFT_MARGIN * 2;
        this.fgContainer.x = (winSize.width - boardViewWidth) / 2;
        this.ingameUI.onResize(winSize.width);
        this.sideMenu.onResize(winSize.width);
        this.scoreUI.onResize(winSize.width);
        this.bgSprite.setScaleX(winSize.width / this.bgSprite.getContentSize().width);
        this.bgRightSprite.setPositionX(winSize.width);
        this.flashEffect.onResize(winSize.width, winSize.height);
        this.tutorial.onResize(winSize.width);
        this.bgParticles.setPosition(winSize.width / 2, 360);
        this.bgParticles.setPosVar({x: winSize.width / 2, y: 360});
        this.bgParticles.setTotalParticles(Math.ceil(winSize.width / 25));
    },

    saveGameState: function () {
        var pack = [this.currentPack[0], this.currentPack[1]];
        var nextPack = [this.nextPack[0], this.nextPack[1]];
        this.gameStateModel.save(this.board.getDump(), this.score, pack, nextPack);
    },

    saveGameLostGameState: function () {
        this.gameStateModel.saveScoreOnly(this.score);
    },

    removeAllBlockModelsAndViews: function () {
        for (var i = 0; i < this.blocks.length; i++) {
            this.blocks[i].sprite.removeFromParent();
        }

        this.blocks = [];
    }
});

var GameBoard = function (gamefield, boardWidth, boardHeight, maxValue) {
    this.COLS = boardWidth;
    this.ROWS = boardHeight;
    this.MAX_VALUE = maxValue;

    this.blocks = [];
    this.gamefield = gamefield;

    this.addBlockAt = function (x, y, value) {
        var block = new Block(x, y, value);
        this.blocks.push(block);
        return block;
    };

    this.getBlockAt = function (x, y) {
        for (var i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i].x == x && this.blocks[i].y == y) {
                return this.blocks[i];
            }
        }
        return null;
    };

    this.markAllBlocksAsNonChecked = function () {
        for (var i = 0; i < this.blocks.length; i++) {
            this.blocks[i].isChecked = false;
        }
    };

    this.searchForMatches = function () {
        var chains = [];
        for (var row = 0; row < this.ROWS; row++) {
            for (var col = 0; col < this.COLS; col++) {
                var block = this.getBlockAt(col, row);
                if (block != null && block.isChecked == false) {
                    var blocksChain = this.checkNextBlock(col, row, []);
                    if (blocksChain.length >= 3) {
                        chains.push(blocksChain);
                    }
                }
            }
        }
        this.markAllBlocksAsNonChecked();
        if (chains.length > 0) {
            this.processChains(chains);
        }
        else {
            this.gamefield.onNoMatchesFoundWithDelay();
        }
    };

    this.checkNextBlock = function (x, y, arr) {
        if (this.coordsAreInBoundaries(x, y) == false) {
            return arr;
        }

        var block = this.getBlockAt(x, y);
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

        this.checkNextBlock(x + 1, y, arr); // right
        this.checkNextBlock(x, y + 1, arr); // up
        this.checkNextBlock(x - 1, y, arr); // left
        this.checkNextBlock(x, y - 1, arr); // down

        return arr;
    };

    this.processChains = function (chains) {
        this.checkForBlackChain(chains);
        var merges = [];
        for (var i = 0; i < chains.length; i++) {
            merges.push(this.processChain(chains[i]));
        }
        this.gamefield.processChainMergesWithDelay(merges);
        // it consists of:
        // gamefield.showBlocksMerging(chain);
        // gamefield.addNewBlockView(block);
        // and when finished, gamefield should call applyGravity()
    };

    this.checkForBlackChain = function (chains) {
        var chainIndex = -1;
        for (var i = 0; i < chains.length; i++) {
            if (chains[i][0].value == this.MAX_VALUE) {
                chainIndex = i;
                break;
            }
        }

        if (chainIndex < 0) {
            return chains;
        }

        var blackChain = chains[chainIndex];
        for (var x = 0; x < this.COLS; x++) {
            for (var y = 0; y <= this.ROWS + 1; y++) {
                var block = this.getBlockAt(x, y);
                if (block != null && blackChain.indexOf(block) < 0) {
                    blackChain.push(block);
                }
            }
        }
        return [blackChain];
    };

    this.processChain = function (chain) {
        var x = chain[0].x;
        var y = chain[0].y;
        var value = this.getNextValue(chain[0].value);
        var block = this.addBlockAt(x, y, value);

        if (value > this.gamefield.maxUnlockedValue) {
            this.gamefield.maxUnlockedValue = value;
        }

        var mergeInfo = {chain: chain, resultingBlock: block};

        for (var i = 0; i < chain.length; i++) {
            this.removeBlock(chain[i]);
        }

        return mergeInfo;
    };

    this.applyGravity = function () {
        var fallingBlocks = [];
        for (var row = 0; row <= this.ROWS - 1; row++) {
            for (var col = 0; col < this.COLS; col++) {
                if (this.getBlockAt(col, row) == null) {
                    var blockFound = false;
                    var rowToCheck = row + 1;
                    while (rowToCheck <= this.ROWS + 1 && blockFound == false) {
                        var blockOnTop = this.getBlockAt(col, rowToCheck);
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
        this.gamefield.showFallingBlocks(fallingBlocks);
        // after gamefield finishes, if it should re-run searchForMatches();
    };

    this.removeBlock = function (block) {
        var index = this.blocks.indexOf(block);
        if (index >= 0) {
            this.blocks.splice(index, 1);
        } else {
            console.log("Trying to remove non-existing block from board");
        }
    };

    this.getNextValue = function (value) {
        if (value < this.MAX_VALUE) {
            return value + 1;
        }
        return value;
    };

    this.coordsAreInBoundaries = function (x, y) {
        return (x >= 0 && x < this.COLS && y >= 0 && y < this.ROWS + 2);
    };

    this.getColHeight = function (col) {
        var height = 0;
        while (this.getBlockAt(col, height) != null) {
            height++;
        }
        return height;
    };

    this.getIsLost = function () {
        for (var i = 0; i < this.COLS; i++) {
            if (this.getColHeight(i) > this.ROWS) {
                return true;
            }
        }
        return false;
    };

    this.clear = function () {
        this.blocks = [];
    };

    this.getDump = function () {
        var i;
        var boardState = [];
        for (i = 0; i < this.COLS * this.ROWS; i++) {
            boardState.push(0);
        }

        for (i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i].y < this.ROWS) {
                boardState[this.blocks[i].x + this.blocks[i].y * this.COLS] = this.blocks[i].value;
            }
        }

        return boardState;
    };
};

var Block = function (x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.isChecked = false;
};

var BlockView = function (block, sprite) {
    this.block = block;
    this.sprite = sprite;
};

var LessStupidNextValueCalculator = function () {
    this.PROBABILITIES = [65, 55, 34, 21, 13, 8, 5, 3, 2, 1];

    this.getValue = function (maxUnlocked) {
        var randBoundary = this.getArrayElementsSumUntil(maxUnlocked);
        var randValue = Math.floor(Math.random() * randBoundary);
        for (var i = 1; i <= this.PROBABILITIES.length; i++) {
            if (randValue < this.getArrayElementsSumUntil(i)) {
                return i;
            }
        }
    };

    this.getArrayElementsSumUntil = function (v) {
        var sum = 0;
        for (var i = 0; i < v; i++) {
            sum += this.PROBABILITIES[i];
        }
        return sum;
    };
};

var ScoreCalculator = function () {
    this.resultingScore = 0;

    this.SCORES = [10, 20, 30, 40, 50, 60, 70, 80, 300, 2500];
    this.CASCADING_MULTIPLIER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    this.packDropped = function () {
        this.resultingScore = 0;
    };

    this.processChains = function (chains, cascadingLength) {
        this.cascadingLength += 1;
        for (var i = 0; i < chains.length; i++) {
            this.resultingScore += this.getChainScore(chains[i], cascadingLength);
        }
    };

    this.getChainScore = function (chain, cascadingLength) {
        var sumOfScoresForEachBlock = this.getSumOfScoresForEachBlock(chain.chain);
        return Math.ceil(sumOfScoresForEachBlock * this.CASCADING_MULTIPLIER[cascadingLength - 1]);
    };

    this.getSumOfScoresForEachBlock = function (chain) {
        var sum = 0;
        for (var i = 0; i < chain.length; i++) {
            sum += this.SCORES[chain[i].value - 1];
        }
        return sum;
    };

    this.getResultingScore = function () {
        return this.resultingScore;
    };

};

var ScoreUI = function (container) {
    this.container = container;
    this.scoreLabel = null;
    this.highScore = 0;
    this.currentScore = 0;
    this.targetScore = 0;
    this.scorePerSecond = 0;
    this.SECONDS_FOR_ONE_SCORE_CHANGE = 1;

    this.COORDS_NORMAL_SCORE = {x: 174, y: 675};
    this.SCALE_NORMAL_SCORE = 1;
    this.COORDS_NORMAL_HISCORE = {x: 65, y: 685};
    this.SCALE_NORMAL_HISCORE = 0.5;

    this.COORDS_CENTERED_SCORE = {x: 174, y: 480};
    this.SCALE_CENTERED_SCORE = 1.2;
    this.COORDS_CENTERED_HISCORE = {x: 150, y: 390};
    this.SCALE_CENTERED_HISCORE = 0.7;

    this.init = function () {
        this.scoreLabel = new cc.LabelBMFont("0", res.scorefont_fnt, 350, cc.TEXT_ALIGNMENT_CENTER);
        this.scoreLabel.setPosition(this.COORDS_NORMAL_SCORE.x, this.COORDS_NORMAL_SCORE.y);
        this.scoreLabel.setScale(this.SCALE_NORMAL_SCORE, this.SCALE_NORMAL_SCORE);
        this.container.addChild(this.scoreLabel);
        this.highScoreLabel = new cc.LabelBMFont("0", res.scorefont_fnt, 250, cc.TEXT_ALIGNMENT_RIGHT);
        this.highScoreLabel.setPosition(this.COORDS_NORMAL_HISCORE.x, this.COORDS_NORMAL_HISCORE.y);
        this.highScoreLabel.setScale(this.SCALE_NORMAL_HISCORE, this.SCALE_NORMAL_HISCORE);
        this.container.addChild(this.highScoreLabel);
    };

    this.showInitial = function (value, highScore) {
        this.currentScore = value;
        this.highScore = highScore;
        this.scoreLabel.setString(this.currentScore);
        this.highScoreLabel.setString(this.highScore);
    };

    this.displayNewScore = function (value) {
        this.targetScore = value;
        this.scorePerSecond = (value - this.currentScore) / this.SECONDS_FOR_ONE_SCORE_CHANGE;
    };

    this.update = function (dt) {
        if (this.currentScore < this.targetScore) {
            this.currentScore += Math.ceil(this.scorePerSecond * dt);
            if (this.currentScore >= this.targetScore) {
                this.currentScore = this.targetScore;
            }
            this.updateLabels();
        }
    };

    this.updateLabels = function () {
        if (this.highScore < this.currentScore) {
            this.highScore = this.currentScore;
            this.highScoreLabel.setString(this.highScore);
        }
        this.scoreLabel.setString(this.currentScore);
    };

    this.displayNewScoreInstantly = function (score) {
        this.currentScore = score;
        this.targetScore = score;
        this.updateLabels();
    };

    this.moveToCenter = function () {
        var duration = 0.5;
        var scoreMoveAction = new cc.MoveTo(duration, this.COORDS_CENTERED_SCORE.x, this.COORDS_CENTERED_SCORE.y).easing(cc.easeCubicActionOut());
        var scoreScaleAction = new cc.ScaleTo(duration, this.SCALE_CENTERED_SCORE, this.SCALE_CENTERED_SCORE).easing(cc.easeCubicActionOut());
        var hiScoreMoveAction = new cc.MoveTo(duration, this.COORDS_CENTERED_HISCORE.x, this.COORDS_CENTERED_HISCORE.y).easing(cc.easeCubicActionOut());
        var hiScoreScaleAction = new cc.ScaleTo(duration, this.SCALE_CENTERED_HISCORE, this.SCALE_CENTERED_HISCORE).easing(cc.easeCubicActionOut());
        this.scoreLabel.runAction(new cc.Spawn(scoreMoveAction, scoreScaleAction));
        this.highScoreLabel.runAction(new cc.Spawn(hiScoreMoveAction, hiScoreScaleAction));
    };

    this.moveToNormalPosition = function () {
        var duration = 0.5;
        var scoreMoveAction = new cc.MoveTo(duration, this.COORDS_NORMAL_SCORE.x, this.COORDS_NORMAL_SCORE.y).easing(cc.easeCubicActionOut());
        var scoreScaleAction = new cc.ScaleTo(duration, this.SCALE_NORMAL_SCORE, this.SCALE_NORMAL_SCORE).easing(cc.easeCubicActionOut());
        var hiScoreMoveAction = new cc.MoveTo(duration, this.COORDS_NORMAL_HISCORE.x, this.COORDS_NORMAL_HISCORE.y).easing(cc.easeCubicActionOut());
        var hiScoreScaleAction = new cc.ScaleTo(duration, this.SCALE_NORMAL_HISCORE, this.SCALE_NORMAL_HISCORE).easing(cc.easeCubicActionOut());
        this.scoreLabel.runAction(new cc.Spawn(scoreMoveAction, scoreScaleAction));
        this.highScoreLabel.runAction(new cc.Spawn(hiScoreMoveAction, hiScoreScaleAction));
    };

    this.onResize = function (width) {
        this.highScoreLabel.setPosition(width - this.COORDS_NORMAL_HISCORE.x - this.container.getPositionX(), this.COORDS_NORMAL_HISCORE.y);
    };

    this.reset = function () {
        this.highScore = 0;
        this.currentScore = 0;
        this.targetScore = 0;
    }
};

var FloatingScore = function (container, fgContainer) {
    this.container = container;
    this.fgContainer = fgContainer;
    this.pool = [];

    this.show = function (x, y, value, cascadingLength) {
        var label = this.getLabelFromPoolOrCreateNew();
        var labelScale = this.getScaleByCascadingLength(cascadingLength);
        label.setScale(0, 0);
        label.setPosition(x + this.fgContainer.getPositionX(), y + this.fgContainer.getPositionY());
        label.isFloatingFinished = false;
        label.setString(value);
        this.container.addChild(label);

        var scaleInAction = new cc.ScaleTo(0.1, labelScale, labelScale).easing(cc.easeBackOut());
        var waitAction = new cc.DelayTime(0.7);
        var scaleOutAction = new cc.ScaleTo(0.2, 0, 0).easing(cc.easeCubicActionIn());
        var scaleSequence = new cc.Sequence(scaleInAction, waitAction, scaleOutAction);

        var moveByAction = new cc.MoveBy(1, 0, 50);
        var callFuncAction = new cc.CallFunc(this.onFloatingFinished, this, label);
        var moveSequence = new cc.Sequence(moveByAction, callFuncAction);

        label.runAction(new cc.Spawn(scaleSequence, moveSequence));
    };

    this.getScaleByCascadingLength = function (cascadingLength) {
        return 1 + (cascadingLength - 1) / 10;
    };

    this.onFloatingFinished = function (target, floatingLabel) {
        floatingLabel.isFloatingFinished = true;
        floatingLabel.removeFromParent();
    };

    this.getLabelFromPoolOrCreateNew = function () {
        for (var i = 0; i < this.pool.length; i++) {
            if (this.pool[i].isFloatingFinished == true) {
                return this.pool[i];
            }
        }

        var label = new cc.LabelBMFont("100", res.floatingscorefont_fnt, 200, cc.TEXT_ALIGNMENT_CENTER);
        this.pool.push(label);
        lowfat.GraphicUtils.retain(label);
        return label;
    };

    this.reset = function () {
        for (var i = 0; i < this.pool.length; i++) {
            this.pool[i].removeFromParent();
            this.pool[i].isFloatingFinished = true;
        }
    }
};

var HintUI = function (container) {
    this.container = container;
    this.hintIcons = [];
    this.lastUnlockedValue = 0;

    this.init = function (maxValue) {
        this.maxValue = maxValue;
        for (var i = 0; i < maxValue; i++) {
            var value = i + 1;
            var hintIcon = lowfat.GameSpriteManager.getSprite("BlockMini" + value, 0.5, 0.5);
            hintIcon.setPosition(23 + (i * 30), 21);
            if (i > 0) {
                hintIcon.setVisible(false);
            }
            this.container.addChild(hintIcon);
            this.hintIcons.push(hintIcon);
        }
    };

    this.show = function (maxUnlockedValue, showHighlight) {
        if (maxUnlockedValue <= this.lastUnlockedValue) {
            return;
        }

        this.lastUnlockedValue = maxUnlockedValue;
        for (var i = 0; i < this.hintIcons.length; i++) {
            this.hintIcons[i].setVisible(i <= maxUnlockedValue - 1);
        }

        if (showHighlight && maxUnlockedValue > 1) {
            this.showHighlightBelowLastUnlockedIcon();
        }
    };

    this.showHighlightBelowLastUnlockedIcon = function () {
        var lastHintIcon = this.hintIcons[this.lastUnlockedValue - 1];
        var highlight = lowfat.GameSpriteManager.getSprite("BlockHintHighlight", 0.5, 0.5);
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
        var callFuncAction = new cc.CallFunc(this.removeHighlight, this, highlight);
        highlight.runAction(new cc.Sequence(delayAction, fadeInAction, pauseAction, fadeOutAction, callFuncAction));
    };

    this.removeHighlight = function (target, highlight) {
        highlight.removeFromParent();
    };

    this.slowlyHide = function (howManyIconsToLeave) {
        var maxDelay = 0.5;
        var duration = 0.2;
        for (var i = howManyIconsToLeave; i < this.lastUnlockedValue; i++) {
            var hintIcon = this.hintIcons[i];
            var delay = maxDelay - (i * (maxDelay / (this.lastUnlockedValue - 1)));
            if (this.lastUnlockedValue == 1) {
                delay = 0;
            }
            var waitAction = new cc.DelayTime(delay);
            var disappearAction = new cc.ScaleTo(duration, 0, 0);
            if (i > 0) {
                hintIcon.runAction(new cc.Sequence(waitAction, disappearAction));
            } else {
                var callFuncAction = new cc.CallFunc(this.onHideFinished, this, howManyIconsToLeave);
                hintIcon.runAction(new cc.Sequence(waitAction, disappearAction, callFuncAction));
            }
        }
    };

    this.onHideFinished = function (target, howManyIconsToLeave) {
        var start = (howManyIconsToLeave !== undefined && howManyIconsToLeave > 0) ? howManyIconsToLeave : 0;

        for (var i = start; i < this.hintIcons.length; i++) {
            this.hintIcons[i].setScale(1, 1);
            this.hintIcons[i].setVisible(false);
        }
    };

    this.reset = function () {
        this.lastUnlockedValue = 0;
        for (var i = 0; i < this.hintIcons.length; i++) {
            this.hintIcons[i].setScale(1, 1);
            this.hintIcons[i].setVisible(false);
        }
    }
};

var TouchControls = function (gamefield) {
    this.gamefield = gamefield;
    this.touchStartCoords = {x: 0, y: 0};
    this.scrollLength = {x: 0, y: 0};
    this.touchStarted = false;
    this.atLeastOneFullSwipePerformed = false;

    this.SWIPE_MIN_LENGTH = 40;

    this.init = function () {
        this.addListeners();
    };

    this.addListeners = function () {
        var that = this;

        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                that.processTouchStarted(touch.getLocation().x, touch.getLocation().y);
                return true;
            },
            onTouchMoved: function (touch, event) {
                that.processTouchUpdated(touch.getLocation().x, touch.getLocation().y, touch.getDelta())
            },
            onTouchEnded: function (touch, event) {
                that.processTouchEnded(touch.getLocation().x, touch.getLocation().y);
            }
        }, this.gamefield);
    };

    this.removeListeners = function () {
        cc.eventManager.removeListeners(cc.EventListener.TOUCH_ONE_BY_ONE);
    };

    this.processTouchStarted = function (touchX, touchY) {
        if (this.gamefield.inputIsLocked || !this.gamefield.sideMenu.processClickAndGetIfAllowed(touchX, touchY)) {
            return;
        }

        this.touchStartCoords.x = touchX;
        this.touchStartCoords.y = touchY;
        this.scrollLength.x = 0;
        this.scrollLength.y = 0;
        this.touchStarted = true;
        this.atLeastOneFullSwipePerformed = false;
    };

    this.processTouchUpdated = function (touchX, touchY, delta) {
        if (this.touchStarted == false || this.gamefield.inputIsLocked) {
            return;
        }

        this.scrollLength.x += delta.x;
        if (delta.y > 0) {
            this.scrollLength.y = 0;
        } else {
            this.scrollLength.y -= delta.y;
        }

        if (this.scrollLength.x > this.SWIPE_MIN_LENGTH) {
            this.gamefield.movePackRight();
            this.atLeastOneFullSwipePerformed = true;
            this.scrollLength.x = 0;
            this.scrollLength.y = 0;
        }
        else if (this.scrollLength.x < -this.SWIPE_MIN_LENGTH) {
            this.gamefield.movePackLeft();
            this.atLeastOneFullSwipePerformed = true;
            this.scrollLength.x = 0;
            this.scrollLength.y = 0;
        }
        else if (this.scrollLength.y > this.SWIPE_MIN_LENGTH) {
            this.gamefield.dropPack();
        }
    };

    this.processTouchEnded = function (touchX, touchY) {
        if (this.touchStarted == false || this.gamefield.inputIsLocked) {
            return;
        }

        this.touchStarted = false;

        if (this.atLeastOneFullSwipePerformed == false) {
            this.gamefield.swapPack();
        }
    }
};

var KeyboardControls = function (gamefield) {
    this.gamefield = gamefield;

    this.init = function () {
        this.addListeners();
    };

    this.addListeners = function () {
        var that = this;

        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function (keyCode, event) {
                if (keyCode == 37) {
                    that.onKeyboardLeft();
                }
                else if (keyCode == 39) {
                    that.onKeyboardRight();
                }
                else if (keyCode == 38) {
                    that.onKeyboardUp();
                }
                else if (keyCode == 40) {
                    that.onKeyboardDown();
                }
            }
        }, this.gamefield);
    };

    this.removeListeners = function () {
        cc.eventManager.removeListeners(cc.EventListener.KEYBOARD);
    };

    this.onKeyboardLeft = function () {
        if (this.gamefield.inputIsLocked) {
            return;
        }

        this.setPreviewsVisible(true);
        this.gamefield.movePackLeft();
    };

    this.onKeyboardRight = function () {
        if (this.gamefield.inputIsLocked) {
            return;
        }

        this.setPreviewsVisible(true);
        this.gamefield.movePackRight();
    };

    this.onKeyboardUp = function () {
        if (this.gamefield.inputIsLocked) {
            return;
        }

        this.gamefield.swapPack();
    };

    this.onKeyboardDown = function () {
        if (this.gamefield.inputIsLocked) {
            return;
        }

        this.gamefield.dropPack();
    };

    this.setPreviewsVisible = function (value) {
        for (var i = 0; i < this.gamefield.blockPreviews.length; i++) {
            this.gamefield.blockPreviews[i].setVisible(value);
        }
    };

    this.removeListeners = function () {
        cc.eventManager.removeListeners(cc.EventListener.KEYBOARD);
    };
};

var DesktopMouseControlsNoDrag = function (gamefield) {
    this.gamefield = gamefield;

    this.init = function () {
        this.addListeners();
    };

    this.addListeners = function () {
        var that = this;

        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseDown: function (event) {
                if (event.getButton() == 0) {
                    that.processLeftMouseDown(event.getLocationX(), event.getLocationY());
                }
                else if (event.getButton() == 2) {
                    that.processRightMouseDown(event.getLocationX(), event.getLocationY());
                }
            },
            onMouseMove: function (event) {
                that.processMouseMove(event.getLocationX(), event.getLocationY());
            },
            onMouseUp: function (event) {
                that.processMouseUp(event.getLocationX(), event.getLocationY());
            }
        }, this.gamefield);
    };

    this.removeListeners = function () {
        cc.eventManager.removeListeners(cc.EventListener.MOUSE);
    };

    this.processLeftMouseDown = function (mouseX, mouseY) {
        if (this.gamefield.inputIsLocked || !this.gamefield.sideMenu.processClickAndGetIfAllowed(mouseX, mouseY)) {
            return;
        }
        this.gamefield.dropPack();
    };

    this.processRightMouseDown = function (mouseX, mouseY) {
        if (this.gamefield.inputIsLocked || !this.gamefield.sideMenu.processClickAndGetIfAllowed(mouseX, mouseY)) {
            return;
        }

        this.gamefield.swapPack();
        this.gamefield.updateBlockPreviews();
    };

    this.mouseOutsideBoard = function (mouseX, mouseY) {
        var rX = mouseX - this.gamefield.fgContainer.x;
        var cellX = this.gamefield.pixelsToCellX(rX);
        var cellY = this.gamefield.pixelsToCellY(mouseY);
        return (cellY >= this.gamefield.ROWS || cellY < 0 || cellX < 0 || cellX >= this.gamefield.COLS);
    };

    this.mouseOutsideBoardX = function (mouseX) {
        var rX = mouseX - this.gamefield.fgContainer.x;
        var cellX = this.gamefield.pixelsToCellX(rX);
        return (cellX < 0 || cellX >= this.gamefield.COLS);
    };

    this.updateNextPackX = function (mouseX) {
        var rX = mouseX - this.gamefield.fgContainer.x;
        var cellX = this.gamefield.pixelsToCellX(rX);
        cellX -= 1;
        if (cellX < 0) {
            cellX = 0;
        } else if (cellX > this.gamefield.COLS - 2) {
            cellX = this.gamefield.COLS - 2;
        }
        this.gamefield.nextPackX = cellX;
    };

    this.blockPositionsRelativeToCenter = [];
    this.processMouseMove = function (mouseX, mouseY) {
        this.updateNextPackX(mouseX);

        if (this.gamefield.inputIsLocked) {
            return;
        }

        if (this.mouseOutsideBoardX(mouseX)) {
            return;
        }

        var blockSize = this.gamefield.BLOCK_SPRITE_WIDTH;
        var suggestedRightBlockX = mouseX - this.gamefield.fgContainer.x - this.gamefield.LEFT_MARGIN;
        var gridLeftX = this.gamefield.LEFT_MARGIN;
        var gridRightX = this.gamefield.LEFT_MARGIN + blockSize * this.gamefield.COLS;
        var previewsDirtyFlag = false;
        this.blockPositionsRelativeToCenter[0] = this.getTopBlockPositionRelativeToCenter(0);
        this.blockPositionsRelativeToCenter[1] = this.getTopBlockPositionRelativeToCenter(1);

        for (var i = 0; i < this.gamefield.topBlocks.length; i++) {
            var topBlock = this.gamefield.topBlocks[i];
            var leftMostX;
            var rightMostX;
            var blockSpriteX;
            var blockPositionRelativeToCenter = this.blockPositionsRelativeToCenter[i];
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

            var blockCellX = this.gamefield.pixelsToCellX(blockSpriteX);
            var oldBlockCellX = topBlock.block.x;
            if (blockCellX != oldBlockCellX) {
                topBlock.sprite.stopAllActions();
                topBlock.sprite.setPositionX(this.gamefield.cellToPixelsX(oldBlockCellX));
                topBlock.sprite.runAction(new cc.MoveTo(0.15, this.gamefield.cellToPixelsX(blockCellX), topBlock.sprite.getPositionY()).easing(cc.easeCubicActionOut()));
                topBlock.block.x = blockCellX;
                previewsDirtyFlag = true;
            }
        }

        if (previewsDirtyFlag == true) {
            this.gamefield.updateBlockPreviews();
        }
    };

    this.processMouseUp = function (mouseX, mouseY) {

    };

    this.getTopBlockPositionRelativeToCenter = function (blockIndex) {
        var index = blockIndex == 0 ? 1 : 0;
        if (gamefield.topBlocks[index].block.x < gamefield.topBlocks[blockIndex].block.x) {
            return 1;
        }
        else if (gamefield.topBlocks[index].block.x > gamefield.topBlocks[blockIndex].block.x) {
            return -1;
        }
        return 0;
    };

    this.setPreviewsVisible = function (value) {
        for (var i = 0; i < this.gamefield.blockPreviews.length; i++) {
            this.gamefield.blockPreviews[i].setVisible(value);
        }
    };
};

var VisualEffectBackgroundHighlight = function (width, height) {
    this.highlightSprite = new cc.LayerColor(cc.color(255, 255, 255), width, height);
    this.highlightSprite.setVisible(false);

    this.HIGHLIGHT_DURATION = 1.8;
    this.FADEOUT_DURATION = 0.7;

    this.init = function (container) {
        container.addChild(this.highlightSprite);
    };

    this.show = function (value) {
        var rectAlpha = this.getHighlightAlpha(value);
        this.highlightSprite.setVisible(true);
        this.highlightSprite.stopAllActions();
        this.highlightSprite.setOpacity(rectAlpha);

        var delayAction = cc.moveBy(this.HIGHLIGHT_DURATION, 0, 0);
        var fadeOutAction = cc.fadeOut(this.FADEOUT_DURATION);
        var callFuncAction = cc.callFunc(this.hide, this);
        this.highlightSprite.runAction(cc.sequence(delayAction, fadeOutAction, callFuncAction));
    };

    this.hide = function () {
        this.highlightSprite.setVisible(false);
    };

    this.getHighlightAlpha = function (value) {
        var result = value * 15;
        return Math.min(result, 80);
    };

    this.onResize = function (width, height) {
        this.highlightSprite.setContentSize(width, height);
    }
};

var Tutorial = function () {
    this.gamefield = null;
    this.container = null;
    this.isMobile = false;
    this.isActive = false;
    this.gameStateModel = null;
    this.currentWidth = 0;
    this.popups = [];
    this.popupGameGoal = null;
    this.popupSwipe = null;
    this.popupSwap = null;

    this.dropPerformed = false;
    this.dropFinished = false;
    this.swapPerformed = false;
    this.movePerformed = false;

    this.init = function (gamefield, container, isMobile, gameStateModel) {
        this.gamefield = gamefield;
        this.container = container;
        this.isMobile = isMobile;
        this.gameStateModel = gameStateModel;
        this.isActive = true;

        this.dropPerformed = false;
        this.dropFinished = false;
        this.swapPerformed = false;
        this.movePerformed = false;

        var introString = lowfat.LocalizationManager.getString("tutorial_goal");
        introString += "\n\n";
        introString += lowfat.LocalizationManager.getString(this.isMobile ? "tutorial_drop_mobile" : "tutorial_drop_pc");
        this.popupGameGoal = this.createPopup(160, introString, lowfat.LocalizationManager.getString("tutorial_goal_header"));
        this.popupGameGoal.setPositionY(710);
        this.popupGameGoal.fadeIn();

        this.gamefield.board.clear();
        this.gamefield.removeAllBlockModelsAndViews();
        this.gamefield.createBlockView(this.gamefield.board.addBlockAt(1, 0, 1));
        this.gamefield.createBlockView(this.gamefield.board.addBlockAt(1, 1, 1));
        this.gamefield.createBlockView(this.gamefield.board.addBlockAt(3, 0, 1));
        this.gamefield.createBlockView(this.gamefield.board.addBlockAt(4, 0, 1));
        this.gamefield.currentPack = [1, 1];
        this.gamefield.nextPack = [2, 1];
        this.gamefield.score = 0;
        this.gamefield.scoreUI.displayNewScoreInstantly(0);
        this.gamefield.ingameUI.setRetryButtonVisible(false);
        this.gamefield.sideMenu.setMenuAvailable(false);
        this.gamefield.maxUnlockedValue = 1;
    };

    this.processDrop = function () {
        if (this.isActive == false || this.dropPerformed == true) {
            return;
        }

        this.popupGameGoal.fadeOut();

        this.dropPerformed = true;
    };

    this.processSwipe = function () {
        if (this.isActive == false || this.movePerformed == true || this.isMobile == false) {
            return;
        }

        if (this.dropFinished) {

            this.popupSwipe.fadeOut();
            if (this.popupSwap != null) {
                this.popupSwap.moveToY(710, 0.3);
            }

            if (this.swapPerformed == true) {
                this.tutorialFinished();
            }
        }

        this.movePerformed = true;
    };

    this.processSwap = function () {
        if (this.isActive == false || this.swapPerformed == true) {
            return;
        }

        if (this.dropFinished) {

            this.popupSwap.fadeOut();

            if ((this.isMobile && this.movePerformed) || (this.isMobile == false)) {
                this.tutorialFinished();
            }
        }

        this.swapPerformed = true;
    };

    this.processDropFinished = function () {
        if (this.isActive == false || this.dropFinished == true) {
            return;
        }

        var swapString;

        if (this.isMobile) {
            var popupsAmount;
            if (!this.swapPerformed && !this.movePerformed) {
                popupsAmount = 2;
            }
            else if (this.swapPerformed || this.movePerformed) {
                popupsAmount = 1;
            }
            else {
                popupsAmount = 0;
            }
            var swipeString = lowfat.LocalizationManager.getString("tutorial_swipe");
            swapString = lowfat.LocalizationManager.getString("tutorial_swap_mobile");

            if (popupsAmount == 2) {
                this.popupSwipe = this.createPopup(70, swipeString);
                this.popupSwap = this.createPopup(70, swapString);
                this.popupSwipe.setPositionY(710);
                this.popupSwap.setPositionY(630);
                this.popupSwipe.fadeIn();
                this.popupSwap.fadeIn(0.2);
            }
            else if (popupsAmount == 1) {
                if (!this.movePerformed) {
                    this.popupSwipe = this.createPopup(70, swipeString);
                    this.popupSwipe.setPositionY(710);
                    this.popupSwipe.fadeIn();
                } else {
                    this.popupSwap = this.createPopup(70, swapString);
                    this.popupSwap.setPositionY(710);
                    this.popupSwap.fadeIn();
                }
            } else {
                this.tutorialFinished();
            }
        } else {
            if (!this.swapPerformed) {
                swapString = lowfat.LocalizationManager.getString("tutorial_swap_pc");
                this.popupSwap = this.createPopup(90, swapString);
                this.popupSwap.setPositionY(710);
                this.popupSwap.fadeIn();
            } else {
                this.tutorialFinished();
            }
        }

        this.dropFinished = true;
    };

    this.tutorialFinished = function () {
        this.gamefield.ingameUI.setRetryButtonVisible(true);
        this.gamefield.sideMenu.setMenuAvailable(true);
        this.gameStateModel.isTutorialFinished = true;
    };

    this.onResize = function (width) {
        if (this.isActive == false) {
            return;
        }

        this.currentWidth = width;

        for (var i = 0; i < this.popups.length; i++) {
            this.popups[i].onResize(width);
        }
    };

    this.BG_MIN_WIDTH = 380;
    this.BG_MAX_WIDTH = 600;
    this.BG_MARGIN_X = 10;
    this.LABEL_MIN_WIDTH = 370;
    this.LABEL_MAX_WIDTH = 580;
    this.LABEL_MARGIN_X = 20;
    this.HEADER_WIDTH = 580;
    this.HEADER_HEIGHT = 50;
    this.HEADER_MARGIN_Y = -2;

    this.createPopup = function (popupHeight, hint, header) {
        var hasHeader = header !== undefined && header != null && header != "";
        var popupNode = new cc.Node();
        var bg = this.createLabelBg(popupHeight);
        var headerLabel = null;
        popupNode.setCascadeOpacityEnabled(true);

        popupNode.addChild(bg);

        if (hasHeader) {
            headerLabel = new cc.LabelTTF(
                header,
                "Arial",
                30,
                cc.size(this.HEADER_WIDTH, this.HEADER_HEIGHT),
                cc.TEXT_ALIGNMENT_CENTER,
                cc.VERTICAL_TEXT_ALIGNMENT_TOP);
            headerLabel.setAnchorPoint(0.5, 1);
            headerLabel.setColor(cc.color(0, 0, 0));
            popupNode.addChild(headerLabel);
            headerLabel.setPositionY(this.HEADER_MARGIN_Y);
        }

        var labelHeight = hasHeader ? popupHeight - 34 : popupHeight;
        var labelY = hasHeader ? -34 : 0;
        var label = new cc.LabelTTF(
            hint,
            "Arial",
            18,
            cc.size(this.LABEL_MIN_WIDTH, labelHeight),
            cc.TEXT_ALIGNMENT_CENTER,
            cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        label.setAnchorPoint(0.5, 1);
        label.setColor(cc.color(0, 0, 0));
        popupNode.addChild(label);
        label.setPositionY(labelY);

        // for debug: show the text areas
        // if (hasHeader) {
        //     var drawNodeHeader = new cc.DrawNode();
        //     drawNodeHeader.drawRect(cc.p(-this.LABEL_MIN_WIDTH / 2, this.HEADER_MARGIN_Y), cc.p(this.LABEL_MIN_WIDTH / 2, labelY), cc.color(15, 56, 120, 100));
        //     drawNodeHeader.setAnchorPoint(0.5, 1);
        //     popupNode.addChild(drawNodeHeader);
        // }
        // var drawNodeLabel = new cc.DrawNode();
        // drawNodeLabel.drawRect(cc.p(-this.LABEL_MIN_WIDTH / 2, labelY), cc.p(this.LABEL_MIN_WIDTH / 2, labelY - labelHeight), cc.color(99, 1, 200, 100));
        // drawNodeLabel.setAnchorPoint(0.5, 1);
        // popupNode.addChild(drawNodeLabel);

        var tutorial = this;
        var popup = {
            popupNode: popupNode,
            hasHeader: hasHeader,
            bg: bg,
            bgHeight: popupHeight,
            headerLabel: headerLabel,
            label: label,
            labelHeight: labelHeight,
            tutorial: tutorial,

            addToParent: function (container) {
                container.addChild(this.popupNode);
            },

            setPositionX: function (x) {
                this.popupNode.setPositionX(x);
            },

            setPositionY: function (y) {
                this.popupNode.setPositionY(y);
            },

            onResize: function (width) {
                var suggestedLabelWidth = width - this.tutorial.LABEL_MARGIN_X * 2;
                var labelWidth = Math.max(Math.min(suggestedLabelWidth, this.tutorial.LABEL_MAX_WIDTH), this.tutorial.LABEL_MIN_WIDTH);
                var suggestedBgWidth = width - this.tutorial.BG_MARGIN_X * 2;
                var bgWidth = Math.max(Math.min(suggestedBgWidth, this.tutorial.BG_MAX_WIDTH), this.tutorial.BG_MIN_WIDTH);

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

        popup.addToParent(this.container);
        this.popups.push(popup);
        popup.onResize(this.currentWidth);
        return popup;
    };

    this.createLabelBg = function (height) {
        var frame = lowfat.GameSpriteManager.getFrame("TutorialBg");
        var capInsets = cc.rect(20, 20, 60, 60);
        var bg = new ccui.Scale9Sprite(frame, capInsets);
        bg.setAnchorPoint(0.5, 1);
        bg.setContentSize(this.BG_MIN_WIDTH, height);
        return bg;
    };
};