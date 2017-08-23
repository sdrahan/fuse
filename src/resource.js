var res = {
    spritesheet_png: "res/spritesheet.png",
    spritesheet_plist: "res/spritesheet.plist",
    floatingscorefont_fnt: "res/floating_score_font-export.fnt",
    floatingscorefont_png: "res/floating_score_font-export.png",
    highscorefont_fnt: "res/high_score_font-export.fnt",
    highscorefont_png: "res/high_score_font-export.png",
    scorefont_fnt: "res/score_font-export.fnt",
    scorefont_png: "res/score_font-export.png",
    sound_match_1: "res/match_1.mp3",
    sound_match_2: "res/match_2.mp3",
    sound_match_3: "res/match_3.mp3",
    sound_match_4: "res/match_4.mp3",
    sound_match_5: "res/match_5.mp3",
    sound_swap: "res/swap.mp3",
    sound_drop: "res/drop.mp3",
    localization_json: "res/localization.json"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
