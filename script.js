document.addEventListener('DOMContentLoaded', () => {
    const encryptBtn = document.getElementById('encryptBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const encryptMessage = document.getElementById('encryptMessage');
    const decryptedMessage = document.getElementById('decryptedMessage');

    const encryptImageInput = document.getElementById('encryptImage');
    const messageInput = document.getElementById('messageInput');
    const decryptImageInput = document.getElementById('decryptImage');

    let encryptedImageDataURL;

    // Enable Encrypt button when an image is selected
    encryptImageInput.addEventListener('change', () => {
        if (encryptImageInput.files.length > 0) {
            encryptBtn.disabled = false;
        } else {
            encryptBtn.disabled = true;
        }
        // Clear the decryption section when interacting with encryption
        clearDecryptionSection();
    });

    // Encrypt functionality
    encryptBtn.addEventListener('click', () => {
        const messageText = messageInput.value.trim();
        if (!messageText) {
            alert('Please enter a message to embed!');
            return;
        }

        const file = encryptImageInput.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
            const image = new Image();
            image.src = event.target.result;
            image.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);

                // Embed the message into the image
                embedMessage(ctx, messageText, image.width, image.height);

                encryptedImageDataURL = canvas.toDataURL('image/png');
                encryptMessage.style.display = 'block';
                downloadBtn.style.display = 'block';
            };
        };
        reader.readAsDataURL(file);
    });

    // Download the encrypted image
    downloadBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = encryptedImageDataURL;
        a.download = 'encrypted_image.png';
        a.click();
    });

    // Enable Decrypt button when an image is selected
    decryptImageInput.addEventListener('change', () => {
        if (decryptImageInput.files.length > 0) {
            decryptBtn.disabled = false;
        } else {
            decryptBtn.disabled = true;
        }
        // Clear the encryption section when interacting with decryption
        clearEncryptionSection();
    });

    // Decrypt functionality
    decryptBtn.addEventListener('click', () => {
        const file = decryptImageInput.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
            const image = new Image();
            image.src = event.target.result;
            image.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);

                // Extract the hidden message
                const hiddenMessage = extractMessage(ctx, image.width, image.height);
                if (hiddenMessage) {
                    decryptedMessage.value = hiddenMessage;
                } else {
                    alert('No hidden message found in the image!');
                }
            };
        };
        reader.readAsDataURL(file);
    });

    // Embed message into the image using multiple channels (RGB) and LSB steganography
    function embedMessage(ctx, message, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Convert the message to binary
        const binaryMessage = stringToBinary(message + '\0'); // Add null terminator
        let messageIndex = 0;

        for (let i = 0; i < data.length && messageIndex < binaryMessage.length; i += 4) {
            // Modify the least significant bit of multiple channels
            for (let j = 0; j < 3; j++) { // R, G, B channels
                data[i + j] = (data[i + j] & ~1) | parseInt(binaryMessage[messageIndex], 10);
                messageIndex++;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Extract message from the image using multiple channels (RGB) LSB
    function extractMessage(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let binaryMessage = '';
        for (let i = 0; i < data.length; i += 4) {
            // Extract LSB from all channels (R, G, B)
            for (let j = 0; j < 3; j++) {
                binaryMessage += (data[i + j] & 1).toString(); // Extract LSB
            }
        }

        // Convert the binary message back to string and remove null terminator
        const message = binaryToString(binaryMessage);
        return message ? message.trim() : null;
    }

    // Convert string to binary
    function stringToBinary(string) {
        return string
            .split('')
            .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
            .join('');
    }

    // Convert binary to string
    function binaryToString(binary) {
        const chars = [];
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.slice(i, i + 8);
            const charCode = parseInt(byte, 2);
            if (charCode === 0) break; // Null terminator
            chars.push(String.fromCharCode(charCode));
        }
        return chars.join('');
    }

    // Clear the encryption section
    function clearEncryptionSection() {
        encryptImageInput.value = '';
        messageInput.value = '';
        encryptMessage.style.display = 'none';
        downloadBtn.style.display = 'none';
    }

    // Clear the decryption section
    function clearDecryptionSection() {
        decryptImageInput.value = '';
        decryptedMessage.value = '';
        decryptBtn.disabled = true;
    }
});
