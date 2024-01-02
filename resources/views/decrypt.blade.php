@extends('layouts.app')
@section('content')

<div class="row my-4">
    <div class="col-lg-8 col-md-6 mb-md-0 mb-4">
      <div class="card">
        <div class="card-header pb-0">
          <div class="row">
            <div class="col-lg-6 col-7">
              <h6>Upload Decrypt</h6>
            </div>
          </div>
        </div>
        <div class="card-body px-0 pb-2">
          <div class="table-responsive">
            <table class="table align-items-center mb-0"> <!-- sini buat upload sini -->
              <thead>
                
              </thead>
              <tbody>
                <!-- file upload start -->

                @include('uploadDecrypt')

                <!-- file upload end -->
              </tbody>
            </table> 
          </div>
        </div>
      </div> 
    </div>
  </div>
 
@endsection

