<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<link rel="stylesheet" type="text/css" href="{{ asset('css/app.css') }}">
	<meta http-equiv="X-UA-Compatible" content="IE=7">
	<meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="csrf-token" content="{{ csrf_token() }}">

</head>
<body>

    <div class="card">
		<div class="top">
    		<p>Drag & drop image you want to encode</p>
			<input type="text" id='secretmessage' placeholder="Input secret message"  hidden/>
    		<button id="uploadButton" type="button" onclick="uploadImages()" >Upload</button>
    	</div>
    	<div class="drag-area">
    		<span class="visible">
				Drag & drop image here or
				<span class="select" role="button">Browse</span>
			</span>
			<span class="on-drop">Drop images here</span>
    		<input name="file" type="file" class="file" id="upup" multiple />
    	</div>
		
		<div id="progressBarContainer">
    		<div id="progressBar"></div>
		</div>

		<div id="message" hidden></div>

	    <!-- IMAGE PREVIEW CONTAINER -->
    	<div class="container"></div>
    </div>
	<script>
    	const baseUrl = "{{ asset('storage') }}";
	</script>
    <script src="{{ asset('js/uploadEncode.js') }}" defer></script>
	<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.3.0/crypto-js.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>

</body>
</html>
