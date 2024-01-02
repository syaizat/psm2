<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use ZipArchive;

class ImageController extends Controller
{
    public function upload(Request $request)
    {
        if ($request->hasFile('images')) {
            $images = $request->file('images');

            foreach ($images as $image) {
                $imageName = time() . '_' . $image->getClientOriginalName();
                $image->storeAs('public/images', $imageName);
            }

            return response()->json(['message' => 'Images uploaded successfully']);
        }

        return response()->json(['message' => 'No images uploaded'], 422);
    }

    public function index()
    {
        // Get the list of images from the public/images directory
        $images = Storage::disk('public')->files('images');

        // Pass the image list to the view
        return response()->json($images);
    }

    public function deleteImage()
    {
        try {
            $directory = 'public/images'; // Specify the storage directory

            $files = Storage::files($directory);

            foreach ($files as $file) {
                Storage::delete($file);
            }

            return response()->json(['message' => 'All files in the public/images directory have been deleted.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function uploadEnc(Request $request)
    {
        if ($request->hasFile('encFiles')) {
            $images = $request->file('encFiles');

            foreach ($images as $image) {
                $imageName = time() . '_' . $image->getClientOriginalName();
                $image->storeAs('public/zip', $imageName);
            }

            return response()->json(['message' => 'enc uploaded successfully']);
        }

        return response()->json(['message' => 'No enc uploaded'], 422);
    }

    public function index2()
    {
        // Get the list of images from the public/zip directory
        $images = Storage::disk('public')->files('zip');

        // Pass the image list to the view
        return response()->json($images);
    }

    public function deleteEnc()
    {
        try {
            $directory = 'public/zip'; // Specify the storage directory

            $files = Storage::files($directory);

            foreach ($files as $file) {
                Storage::delete($file);
            }

            return response()->json(['message' => 'All files in the public/zip directory have been deleted.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

}
