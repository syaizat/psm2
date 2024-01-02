
document.addEventListener("DOMContentLoaded", function() {
    deleteEncryptedImage()
});

/** Variables */
let files = [],
dragArea = document.querySelector('.drag-area'),
input = document.querySelector('.drag-area input'),
button = document.querySelector('.card button'),
select = document.querySelector('.drag-area .select'),
container = document.querySelector('.container');

/** CLICK LISTENER */
select.addEventListener('click', () => input.click());

/* INPUT CHANGE EVENT */
input.addEventListener('change', () => {
    let file = input.files;

    // if user selects no image
    if (file.length == 0) return;

    if (file.length > 1) {
        alert('Only one image can be uploaded at a time. Please select a single image.');
        return;
    }

    // Only allow the first selected image, ignore others
    const selectedFile = file[0];

    // Check if the selected file is an image
    if (selectedFile.type.split("/")[0] !== 'image') {
        alert("Only image files can be uploaded.");
        return;
    }

    // Clear existing files and add the selected image
    files = [selectedFile];
    showImages();
});

/** SHOW IMAGES */
function showImages() {
	container.innerHTML = files.reduce((prev, curr, index) => {
		return `${prev}
		    <div class="image">
			    <span onclick="delImage(${index})">&times;</span>
			    <img src="${URL.createObjectURL(curr)}" />
			</div>`
	}, '');
}

/* DELETE IMAGE */
function delImage(index) {
   files.splice(index, 1);
   showImages();
}

/* DRAG & DROP */
dragArea.addEventListener('dragover', e => {
	e.preventDefault()
	dragArea.classList.add('dragover')
})

/* DRAG LEAVE */
dragArea.addEventListener('dragleave', e => {
	e.preventDefault()
	dragArea.classList.remove('dragover')
});

/* DROP EVENT */
dragArea.addEventListener('drop', e => {
    e.preventDefault();
    dragArea.classList.remove('dragover');

    let file = e.dataTransfer.files;

    if (file.length > 1) {
        alert('Only one image can be uploaded at a time. Please select a single image.');
        return;
    }

    // Only allow the first dropped image, ignore others
    const droppedFile = file[0];

    // Check if the dropped file is an image
    if (droppedFile.type.split("/")[0] !== 'image') {
        alert("Only image files can be uploaded.");
        return;
    }

    // Clear existing files and add the dropped image
    files = [droppedFile];
    showImages();
});

//clear image
function clearImages() {
	location.reload();
}

//upload
function uploadImage() {
    var formData = new FormData();

    if (files.length === 0) {
        alert('Please select at least one image to upload.');
        return;
    }

    for (var i = 0; i < files.length; i++) {
        formData.append('images[]', files[i]);
    }

    axios.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: function (progressEvent) {
            var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            updateProgressBar(percentCompleted);
        },
    })
    .then(function (response) {
        document.getElementById('message').innerText = response.data.message;
        alert('Images uploaded successfully');
        resetProgressBar();
        // Update the button text and onclick event
        var uploadButton = document.getElementById('uploadButton');
        uploadButton.innerText = 'Decode and Download';
        uploadButton.onclick = function () {
            decodeMessageInImagesAndDownload()
        };
    })
    .catch(function (error) {
        console.error('Error uploading images:', error);
        resetProgressBar();
    });
}

function updateProgressBar(percent) {
    var progressBar = document.getElementById('progressBar');
    progressBar.style.width = percent + '%';
    progressBar.innerText = percent + '%';
}

function resetProgressBar() {
    var progressBar = document.getElementById('progressBar');
    progressBar.style.width = '0%';
    progressBar.innerText = '0%';
}

//Decode stuff

function decodeMessageInImagesAndDownload() {
    let messagecheck;
    return fetch('/images')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch images. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(imageFilenames => {
            console.log('Fetched images:', imageFilenames);
            console.log(`Fetched ${imageFilenames.length} images for encoding.`);
            const zip = new JSZip();

            // Iterate over each image filename
            const promises = imageFilenames.map(imageName => {
                // Fetch the original image
                const imageUrl = `${baseUrl}/${imageName}`;
                return fetch(imageUrl)
                    .then(response => response.blob())
                    .then(imageBlob => {
                        // Decode the message from the original image
                        return decodeMessageFromPixels(imageBlob)
                            .then(decodedMessage => {
                                messagecheck = decodedMessage;
                                console.log('Final Decoded Message:', decodedMessage);

                                // Add the original image to the zip file
                                const imageFile = `${imageName}`;
                                zip.file(imageFile, imageBlob);

                                // Convert the decoded message to a text file
                                const textFilename = `${imageName.replace(/\.[^/.]+$/, "")}.txt`; // Use the image name without extension
                                const textContent = decodedMessage;
                                zip.file(textFilename, textContent);

                                // Return the text filename for reference or additional actions
                                return textFilename;
                            })
                            .catch(error => {
                                console.error('Error decoding message:', error);
                                // Handle errors
                                throw error; // Propagate the error
                            });
                    });
            });

            // Wait for all promises to complete before proceeding
            return Promise.all(promises)
                .then(textFileNames => {
                    console.log('Files created:', textFileNames);
                    
                    // Generate a blob of the zip file and download it
                    return zip.generateAsync({ type: 'blob' });
                    
                })
                .then(zipBlob => {
                    if (startsWithSecretMessage(messagecheck)) {
                        downloadZipFile(zipBlob, 'decoded_files.zip');
                    }
                });
        })
        .catch(error => {
            console.error('Error during decoding and download:', error);
        });
}

function decodeMessageFromPixels(imageBlob) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Set willReadFrequently attribute to true
        canvas.willReadFrequently = true;

        const image = new Image();
        image.onload = function () {
            try {
                // Log the image URL
                console.log('Image URL:', URL.createObjectURL(imageBlob));

                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0);

                const messageBits = [];

                // Decode the message from the least significant bits of the image pixels
                for (let i = 0; i < image.width * image.height; i++) {
                    const x = i % image.width;
                    const y = Math.floor(i / image.width);

                    const pixel = context.getImageData(x, y, 1, 1);
                    const pixelData = pixel.data;

                    // Decode the message bit from the blue channel (LSB)
                    const lsb = pixelData[2] & 0x01;
                    messageBits.push(lsb);

                    // Break the loop when reaching the end of the message
                    if (messageBits.length % 8 === 0 && messageBits.slice(-8).join('') === '00000000') {
                        break;
                    }
                }

                // Convert the message bits to characters
                const decodedMessage = messageBits
                    .slice(0, -8) // Remove the end marker bits
                    .join('')
                    .match(/.{1,8}/g)
                    .map(byte => String.fromCharCode(parseInt(byte, 2)))
                    .join('');

                resolve(decodedMessage);
            } catch (error) {
                console.error("Error decoding message:", error);
                resolve('No encoded message found in the image');
            }
        };

        image.onerror = function (event) {
            console.error("Error loading image:", event);
            resolve('No encoded message found in the image');
        };

        // Handle other errors that might not trigger the 'onerror' event
        image.addEventListener('error', function (event) {
            console.error("Error event on image:", event);
            resolve('No encoded message found in the image');
        });

        image.crossOrigin = 'anonymous'; // Add this line for cross-origin support
        image.src = URL.createObjectURL(imageBlob);
    });
}

function startsWithSecretMessage(str) {
    // Check if the string starts with "secret message :"
    secret = str.startsWith("Secret message :");
    if(secret === false){
        alert('No encoded message found in the image');
        clearImages();
        return false;
    }else{
        return true;
    }
}

function deleteEncryptedImage() {
    // Fetch CSRF token from the page's meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    // Make a DELETE request with the CSRF token included in headers
    return fetch('/delete-images', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to delete images. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error deleting images:', error);
        });

}

function downloadZipFile(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    deleteEncryptedImage()
    clearImages();
}

