import scale from './var';
import renderChatHeader from './chatHeader';
import renderChatInputBar from './chatInputBar';
import renderChat from './chat';
import { rawColors, semanticColors } from '../defaultColors';

// Returns hex string for color
function getSemanticColor(key, theme) {
    return semanticColors[key].colors[theme]
};

function getRawColor(key) {
    return rawColors[key]
};

function tryDrawRef({ctx, w, h}, { ref }) {
    ctx.save();
    ctx.globalAlpha = ref.alpha;
    try {
        ctx.drawImage(ref.image, 0, 0, w, h);
    } catch { };
    ctx.restore();
}

const urlParams = new URLSearchParams(window.location.search);
const importcss = urlParams.get('css');
if (importcss) {
    var link = document.createElement("link");
    link.setAttribute("href", importcss);
    link.setAttribute("type", "text/css");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("media", "screen,print");
    document.head.appendChild(link);
}

const canvas = document.createElement('canvas');
canvas.width = scale(720)[0];
canvas.height = scale(1466)[0];
document.body.appendChild(canvas);


window.setmessages = async () => { };

function renderCanvas(options) {
    console.log("options", options);
    
    // Get the canvas element
    const [w,h] = [canvas.width, canvas.height];
    const ctx = canvas.getContext('2d');
    let render = (f)=>f({ ctx, w, h }, options);
    ctx.clearRect(0, 0, w, h);

    render(renderChat);
    render(renderChatInputBar);
    render(renderChatHeader);

    options.ref?.image && render(tryDrawRef);
};

let options = {
    getSColor: (k)=>getSemanticColor(k, "dark"),
    getRColor: (k) => getRawColor(k, "dark"),
    getBackground: () => undefined,
    messages: []
};
window.options = options;

let loadedImages = {};

async function loadImage(uri) {
    return new Promise(res => { 
        if (!uri) return res(null);
        if (loadedImages[uri]) return res(loadedImages[uri]);
        let img = new Image();
        img.src = uri;
        loadedImages[uri] = img;
        img.onload = function () {
            return res(img);
        }
        img.onerror = function () {
            return res(null);
        }
    });
}

(async () => {
    for (const font of [
        new FontFace("gg-sans", "url(assets/fonts/ggsans-Normal.ttf)", {
            style: "normal",
            weight: 400
        }),
        new FontFace("gg-sans", "url(assets/fonts/ggsans-Medium.ttf)", {
            style: "normal",
            weight: 500
        }),
        new FontFace("gg-sans", "url(assets/fonts/ggsans-Semibold.ttf)", {
            style: "normal",
            weight: 600
        }),
        new FontFace("gg-sans", "url(assets/fonts/ggsans-Bold.ttf)", {
            style: "normal",
            weight: 700
        }),
    ]) {
        document.fonts.add(font);
        await font.load();
    };

    window.targetFunction = async (o) => {
        let bg = o.getBackground();
        let bgimage = await loadImage(bg?.url);
        let refimage = await loadImage(o.ref?.url);

        for (const message of o.messages) {
            message.author.avatar = await loadImage(message.author.avatarUrl);
        };

        renderCanvas({ ...o, getBackground: () => ({ ...bg, image: bgimage }), ref: { ...o.ref, image: refimage } });
    };

    renderCanvas(options);
    window._isCanvasLoaded = true;
    window._onLoadCallbacks.forEach(cb => cb());
})();