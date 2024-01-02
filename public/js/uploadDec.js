
document.addEventListener("DOMContentLoaded", function() {
    deleteDecryptedFiles()
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

    // if user selects no file
    if (file.length == 0) return;

    for (let i = 0; i < file.length; i++) {
        if (file[i].name.endsWith('.enc')) {
            if (!files.some(e => e.name == file[i].name)) files.push(file[i]);
        }else {
            var invalidFileDetected = true;
        }
    }
    
    if (invalidFileDetected) {
        alert("Only .enc files can be uploaded.");
    }

    showFiles();
});

/** SHOW FILES */
function showFiles() {
    container.innerHTML = files.reduce((prev, curr, index) => {
        return `${prev}
            <div class="file">
                <span onclick="delFile(${index})">&times;</span>
                <div>${curr.name}</div>
            </div>`;
    }, '');
}

/* DELETE FILE */
function delFile(index) {
    files.splice(index, 1);
    showFiles();
}

/* DRAG & DROP */
dragArea.addEventListener('dragover', e => {
    e.preventDefault();
    dragArea.classList.add('dragover');
});

/* DRAG LEAVE */
dragArea.addEventListener('dragleave', e => {
    e.preventDefault();
    dragArea.classList.remove('dragover');
});

/* DROP EVENT */
dragArea.addEventListener('drop', e => {
    e.preventDefault();
    dragArea.classList.remove('dragover');

    let droppedFiles = e.dataTransfer.files;
    for (let i = 0; i < droppedFiles.length; i++) {
        /** Check if the dropped file is an .enc file */
        if (droppedFiles[i].name.endsWith('.enc')) {
            if (!files.some(e => e.name == droppedFiles[i].name)) files.push(droppedFiles[i]);
        }else {
            var invalidFileDetected = true;
        }
    }
    
    if (invalidFileDetected) {
        alert("Only .enc files can be uploaded.");
    }

    showFiles();
});

//reset
function clearEnc() {
	location.reload();
}

// Upload
function uploadEncFiles() {
    var formData = new FormData();

    if (files.length === 0) {
        alert('Please select at least one .enc file to upload.');
        return;
    }

    for (var i = 0; i < files.length; i++) {
        formData.append('encFiles[]', files[i]);
    }

    axios.post('/upload-enc', formData, {
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
        alert('.enc files uploaded successfully');
        resetProgressBar();
        // Update the button text and onclick event
        var uploadButton = document.getElementById('uploadButton');
        uploadButton.innerText = 'Decrypt and Download';
        secretinput.hidden = false;
        uploadButton.onclick = function () {
            //secret key
            secretkey = secretinput.value.toUpperCase();
            if (secretkey === "") {
                alert("Please input your secret key");
                
            }else{
                var userConfirmation = confirm("Confirm secret key : " + secretkey + "?");
                if (userConfirmation) {
                    decryptAllEncFilesAndDownload()
                        .then(function () {
                            // Code to execute after the asynchronous operation is complete
                            console.log('Decryption and download completed.');
                        })
                        .catch(function (error) {
                            // Handle errors during the asynchronous operation
                            console.error('Error during Decryption and download:', error);
                        });
                }
                    
            }
        };
    })
    .catch(function (error) {
        console.error('Error uploading .enc files:', error);
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

// Decrypt stuff

function decryptAllEncFilesAndDownload() {
    return fetch('/encs')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch images. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(imageFilenames => {
            console.log('Fetched images:', imageFilenames);
            console.log(`Fetched ${imageFilenames.length} images for decryption.`);
            const zip = new JSZip();

            // Iterate over each image filename
            const promises = imageFilenames.map(imageName => {
                return decryptImage(imageName)
                    .then(decryptedData => {
                        // Assuming decryptedData is a Blob
                        zip.file(imageName.replace('.enc', ''), decryptedData);
                    })
                    .catch(error => {
                        console.error(`Error processing encrypted image ${imageName}:`, error);
                        // If you want to continue with other images, return a default value or handle appropriately
                    });
            });

            // Wait for all promises to complete before proceeding
            return Promise.all(promises)
                .then(() => zip.generateAsync({ type: 'blob' }))
                .then(zipBlob => {
                    downloadZipFile(zipBlob, 'decrypted_images.zip');
                });
        })
        .catch(error => {
            console.error('Error during decryption and download:', error);
        });
}

function decryptImage(imageName) {
    secretkey = secretinput.value.toUpperCase();
    console.log('decryption function imageName:', imageName);
    const encryptedUrl = `${baseUrl}/${imageName}`;
    return fetch(encryptedUrl)
        .then(response => response.text()) // Assuming the encrypted data is a string
        .then(encryptedData => {
            const decryptedBase64 = CryptoJS.AES.decrypt(encryptedData, secretkey).toString(CryptoJS.enc.Utf8);
            return base64ToBlob(decryptedBase64);
        });
}

function base64ToBlob(base64Data) {
    const binaryString = window.atob(base64Data);
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return new Blob([uint8Array], { type: 'image/jpeg' }); // Adjust the MIME type accordingly
}

function deleteDecryptedFiles() {
    // Fetch CSRF token from the page's meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    // Make a DELETE request with the CSRF token included in headers
    return fetch('/delete-enc', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to delete files. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error deleting files:', error);
        });

}

function downloadZipFile(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    deleteDecryptedFiles()
    clearEnc()
}