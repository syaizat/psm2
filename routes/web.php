<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
// web.php or routes/web.php

Route::redirect('/', '/encrypt');

Route::get('encrypt', function () {
    return view('encrypt');
})->name('encrypt');

Route::get('decrypt', function () {
    return view('decrypt');
})->name('decrypt');

Route::get('encode', function () {
    return view('encode');
})->name('encode');

Route::get('decode', function () {
    return view('decode');
})->name('decode');

//upload

use App\Http\Controllers\ImageController;

Route::post('/upload', [ImageController::class, 'upload']);
Route::get('/images', [ImageController::class, 'index']);
Route::delete('/delete-images', [ImageController::class, 'deleteImage']);
Route::post('/upload-enc', [ImageController::class, 'uploadEnc']);
Route::get('/encs', [ImageController::class, 'index2']);
Route::delete('/delete-enc', [ImageController::class, 'deleteEnc']);
