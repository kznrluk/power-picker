const CURSOR_PREVIEW_PIXEL_SIZE = [8, 8]; // display -> 16 + 1 (center dot)
const CURSOR_PREVIEW_ZOOM_SCALE = 16

let mouseMoving = false;
let currentCursorPosition = [1, 1];
const updateCursorPosition = (e) => {
    currentCursorPosition = [e.offsetX, e.offsetY];
    const preview = document.getElementById('cursor_preview');
    preview.style.left = `${e.clientX - 64}px`;
    preview.style.top = `${e.clientY - 64}px`;
}

const getScreenMediaStreamPromise = () => {
    return navigator.mediaDevices.getDisplayMedia({
        // no audio
        audio: false,
        video: {
            cursor: "always"
        }
    }).catch(() => {
        const url = new URL(location.href);
        const isJapanese = url.pathname.endsWith('ja.html');
        if (isJapanese) {
            alert('カラーピッカーの利用にはスクリーンレコードの許可が必要です(送信や保存は行っておりません)');
        } else {
            alert('Screen record permission is required to use the color picker (we do not transmit or store the color picker)')
        }
    })
}

const usePicker = async (videoElm) => {
    videoElm.srcObject = await getScreenMediaStreamPromise();
    const descriptionDiv = document.getElementById('description')
    descriptionDiv.style.display = 'none';

    videoElm.addEventListener('canplay', () => {
        const canvas = document.getElementById('main_preview');
        canvas.width =  videoElm.videoWidth;
        canvas.height = videoElm.videoHeight;
        const c = canvas.getContext('2d')

        const cursorPreview = document.getElementById('cursor_preview');
        cursorPreview.width = CURSOR_PREVIEW_PIXEL_SIZE[0] * CURSOR_PREVIEW_ZOOM_SCALE + 1;
        cursorPreview.height = CURSOR_PREVIEW_PIXEL_SIZE[1] * CURSOR_PREVIEW_ZOOM_SCALE + 1;
        const ctxCP = cursorPreview.getContext('2d');

        const colorPreviewDiv = document.getElementById('color_preview');
        const RGBPreviewP = document.getElementById('rgb');
        const HEXPreviewP = document.getElementById('hex');
        const [diffX, diffY] = CURSOR_PREVIEW_PIXEL_SIZE.map(e => e / 2);

        ctxCP.imageSmoothingEnabled = false;

        setInterval(() => {
            const [x, y] = currentCursorPosition;
            c.drawImage(videoElm, 0, 0, canvas.width, canvas.height);
            const d = c.getImageData(x, y, 1, 1);

            //
            colorPreviewDiv.style.backgroundColor = `RGB(${[...d.data].splice(0, 3).join()})`;
            const newRGBText = `rgb(${[...d.data].splice(0, 3).join()})`;
            const newHEXText = `#${[...d.data].splice(0, 3).map(e => e.toString(16).padStart(2, '0').toUpperCase()).join('')}`;
            if (RGBPreviewP.innerText !== newRGBText) {
                RGBPreviewP.innerText = newRGBText;
                HEXPreviewP.innerText = newHEXText;
            }


            ctxCP.drawImage(
                canvas,
                // from
                x - diffX,
                y - diffY,
                CURSOR_PREVIEW_PIXEL_SIZE[0] + 1,
                CURSOR_PREVIEW_PIXEL_SIZE[1] + 1,
                // dest
                0,
                0,
                cursorPreview.width,
                cursorPreview.height
            );
        }, 16)

        const img = document.createElement("img");
        img.src = canvas.toDataURL();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('get').addEventListener('click', () => {
        usePicker(document.getElementById("preview"))
    });

    document.getElementById('main_preview').addEventListener('mousedown', (e) => {
        mouseMoving = true;
        console.log(e)
        updateCursorPosition(e);
    });
    document.getElementById('main_preview').addEventListener('mouseup', () => mouseMoving = false);
    document.getElementById('main_preview').addEventListener('mousemove', (e) => {
        if (mouseMoving) {
            updateCursorPosition(e);
        }
    });
})

