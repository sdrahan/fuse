var lowfat = lowfat || {};

var GameScene = cc.Scene.extend({
    soundManager: null,
    gamefield: null,
    gameStateModel: null,
    background: null,

    setup: function () {
        this.soundManager = lowfat.SoundManager();
        this.gameStateModel = lowfat.GameStateModel(this.soundManager);
        this.gameStateModel.init(this);
        this.background = lowfat.Background(lowfat.SpriteFactory, this, cc.director.getWinSize());
        this.background.init();
        this.startBoard();
        this.scheduleUpdate();
    },

    startBoard: function () {
        this.gamefield = new lowfat.Gamefield(this, lowfat.SpriteFactory, this.gameStateModel, this.soundManager, cc.director.getWinSize());
        this.gamefield.start();
    },

    update: function (dt) {
        this.gamefield.update(dt);
    },

    onResize: function () {
        var screenSizeInPoints = cc.director.getWinSize();
        this.background.onResize(screenSizeInPoints);
        this.gamefield.onResize(screenSizeInPoints);
    }
});