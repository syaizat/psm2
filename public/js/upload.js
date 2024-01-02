
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
secretinput = document.getElementById('key');

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
        uploadButton.innerText = 'Encrypt and Download';

        secretinput.hidden = false;

        uploadButton.onclick = function () {
            //secret key
            secretkey = secretinput.value.toUpperCase();
            if (secretkey === "") {
                alert("Please input your secret key");
                
            }else{
                var userConfirmation = confirm("Proceed with this secret key : " + secretkey + "?");
                if (userConfirmation) {
                    encryptAllImagesAndDownload()
                        .then(function () {
                            // Code to execute after the asynchronous operation is complete
                            console.log('Encryption and download completed.');
                        })
                        .catch(function (error) {
                            // Handle errors during the asynchronous operation
                            console.error('Error during encryption and download:', error);
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

//crypto stuff
//encrypt stuff
function encryptAllImagesAndDownload() {
    return fetch('/images')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch images. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(imageFilenames => {
            console.log('Fetched images:', imageFilenames);
            console.log(`Fetched ${imageFilenames.length} images for encryption.`);
            const zip = new JSZip();

            // Iterate over each image filename
            const promises = imageFilenames.map(imageName => {
                return encryptImage(imageName)
                    .then(encryptedData => {
                        zip.file(imageName + '.enc', encryptedData);;
                    })
                    .catch(error => {
                        console.error(`Error processing image ${imageName}:`, error);
                        // If you want to continue with other images, return a default value or handle appropriately
                    });;
            });

            // Wait for all promises to complete before proceeding
            return Promise.all(promises)
                .then(() => zip.generateAsync({ type: 'blob' }))
                .then(zipBlob => {
                    downloadZipFile(zipBlob, 'encrypted_images.zip');
                });
        })
        .catch(error => {
            console.error('Error during encryption and download:', error);
        });

}

function encryptImage(imageName) {
    secretkey = secretinput.value.toUpperCase();
    console.log('encryption function imageName:', imageName);
    const imageUrl = `${baseUrl}/${imageName}`;
    return fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            console.log('Image Blob:', blob);
            return blobToBase64(blob);
        })
        .then(base64Data => CryptoJS.AES.encrypt(base64Data, secretkey ).toString());
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

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = function () {
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
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
    clearImages()
}
