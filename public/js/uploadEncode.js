
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
secretinput = document.getElementById('secretmessage');

/** CLICK LISTENER */
select.addEventListener('click', () => input.click());

/* INPUT CHANGE EVENT */
input.addEventListener('change', () => {
	let file = input.files;
        
    // if user select no image
    if (file.length == 0) return;
         
	for(let i = 0; i < file.length; i++) {
        if (file[i].type.split("/")[0] != 'image') {
            var invalidFileDetected = true;
            continue;
        }
		if (!files.some(e => e.name == file[i].name)) files.push(file[i])
	}
    if (invalidFileDetected) {
        alert("Only image files can be uploaded.");
    }
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
	e.preventDefault()
    dragArea.classList.remove('dragover');

	let file = e.dataTransfer.files;
	for (let i = 0; i < file.length; i++) {
		/** Check selected file is image */
		if (file[i].type.split("/")[0] != 'image') {
            var invalidFileDetected = true;
            continue;
        }
		if (!files.some(e => e.name == file[i].name)) files.push(file[i])
	}
    if (invalidFileDetected) {
        alert("Only image files can be uploaded.");
    }
	showImages();
});

//clear image
function clearImages() {
	location.reload();
}

//upload
function uploadImages() {
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
        uploadButton.innerText = 'Encode and Download';
        secretinput.hidden = false;
        uploadButton.onclick = function () {
            secretkey = secretinput.value;
            if (secretkey === "") {
                alert("Please input your secret message");
                
            }else{
                var userConfirmation = confirm("Proceed with this secret message: " + secretkey + "?");
                if (userConfirmation) {
                    encodeMessageInImagesAndDownload()
                        .then(function () {
                            // Code to execute after the asynchronous operation is complete
                            console.log('Encode and download completed.');
                        })
                        .catch(function (error) {
                            // Handle errors during the asynchronous operation
                            console.error('Error during encoding and download:', error);
                        });
                }
            
            }
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

//encode stuff
function encodeMessageInImagesAndDownload() {
    secretkey = secretinput.value
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
                const message = "Secret message : '" + secretkey + "' message end "; // secret message
                return encodeMessageInImage(imageName, message)
                    .then(encodedData => {
                        zip.file(imageName + '.png', encodedData, { binary: true });
                    })
                    .catch(error => {
                        console.error(`Error processing image ${imageName}:`, error);
                        // If you want to continue with other images, return a default value or handle appropriately
                    });
            });

            // Wait for all promises to complete before proceeding
            return Promise.all(promises)
                .then(() => zip.generateAsync({ type: 'blob' }))
                .then(zipBlob => {
                    downloadZipFile(zipBlob, 'encoded_images.zip');
                });
        })
        .catch(error => {
            console.error('Error during encoding and download:', error);
        });
}

function encodeMessageInImage(imageName, message) {
    console.log('Encoding message in image:', imageName);
    const imageUrl = `${baseUrl}/${imageName}`;

    return fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            console.log('Image Blob:', blob);
            return encodeMessageInPixels(blob, message);
        })
        .then(encodedData => encodedData);
}

function encodeMessageInPixels(imageBlob, message) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const image = new Image();
        image.onload = function () {
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);

            // Convert the message to an array of bits
            const messageBits = message.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');

            // Encode the message bits in the least significant bits of the image pixels
            let messageIndex = 0;
            for (let i = 0; i < image.width * image.height; i++) {
                const x = i % image.width;
                const y = Math.floor(i / image.width);

                const pixel = context.getImageData(x, y, 1, 1);
                const pixelData = pixel.data;

                // Encode the message bit in the blue channel (LSB)
                pixelData[2] = (pixelData[2] & 0xFE) | parseInt(messageBits[messageIndex], 2);

                context.putImageData(pixel, x, y);

                messageIndex++;

                // Break the loop when the entire message is encoded
                if (messageIndex === messageBits.length) {
                    break;
                }
            }

            // Create a new Blob with the modified pixel data
            canvas.toBlob(blob => resolve(blob), 'image/png');
        };

        image.onerror = reject;
        image.crossOrigin = 'anonymous'; // Add this line for cross-origin support
        image.src = URL.createObjectURL(imageBlob);
    });
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

