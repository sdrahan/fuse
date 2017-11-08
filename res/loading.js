(function () {
    var createStyle = function () {
        return ".cocosLoading{position:absolute;margin:-30px -60px;padding:0;top:50%;left:50%}" + ".cocosLoading span{color:#CCC;text-align:center;display:block;font-family:Arial, Helvetica, sans-serif;font-size:1.2em}";
    };
    var createDom = function () {
        id = "cocosLoading";
        var div = document.createElement("div");
        div.className = "cocosLoading";
        div.id = id;
        var img = document.createElement("img");
        img.src = "data:image/png;base64,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";
        div.appendChild(img);
        document.body.appendChild(div);
        // var span = document.createElement("span");
        // span.innerHTML = "Loading";
        // div.appendChild(span);
        // document.body.appendChild(div);
    };

    (function () {
        document.body.style.background = "#000000";
        var style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = createStyle();
        document.head.appendChild(style);
        createDom();
    })()
})();