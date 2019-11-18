import { Component, OnInit, NgZone } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import IRoom from '../models/IRoom';
import { v4 as uuid } from 'uuid';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-add-room',
  templateUrl: './add-room.page.html',
  styleUrls: ['./add-room.page.scss'],
})
export class AddRoomPage implements OnInit {

  private cameraPreview = 'https://ecclean.co.za/wp-content/uploads/2019/02/placeholder-icon.png';
  private imageToUpload = '';
  private newRoom: IRoom = {
    id: '',
    title: '',
    description: '',
    capacity: null,
    address: '',
    lat: 0,
    long: 0,
    likes: 0,
    available: true,
    fromDate: new Date(),
    toDate: new Date(),
    imageUrl: '',
    landlord: ''
  };

  private cameraOptions: CameraOptions = {
    quality: 15,
    destinationType: this.camera.DestinationType.DATA_URL,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE
  };

  constructor(
    private camera: Camera,
    private ngZone: NgZone,
    private fireStorage: AngularFireStorage,
    private firestore: AngularFirestore,
    private firebaseAuth: AngularFireAuth
  ) {}

  ngOnInit() {
  }

  async takePicture() {
    try {
      const imageData = await this.camera.getPicture(this.cameraOptions);
      this.imageToUpload = imageData;
      this.cameraPreview = 'data:image/jpeg;base64,' + imageData;
    } catch (error) {
      console.log(error);
    }
  }

  async uploadPicture() {
    const fileName = `room-${uuid()}.jpg`;
    const fireRef = this.fireStorage.ref(fileName);
    try {
      const uploadTask = fireRef.putString(
        this.imageToUpload,
        'base64'
      );
      await uploadTask.then();
    } catch (error) {
      console.log(error);
    }
    return fireRef.getDownloadURL().toPromise();
  }

  async publishRoom() {
    this.newRoom.imageUrl = await this.uploadPicture();
    const user = await this.firebaseAuth.authState.pipe(first()).toPromise();
    this.newRoom.landlord = user.email;
    const roomsRef = this.firestore.collection<IRoom>('rooms');

    await roomsRef.add(this.newRoom);
  }

  async getLocation() {
    try {
     navigator.geolocation.getCurrentPosition(this.onLocationSuccess.bind(this));
    } catch (error) {
      console.log(error);
    }
  }

  async onLocationSuccess(position: any) {
    console.log(position.coords);
    this.newRoom.lat = position.coords.latitude;
    this.newRoom.long = position.coords.longitude;
    const response = await fetch(`
        https://nominatim.openstreetmap.org/reverse?
        format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`
        );
    const geocode = await response.json();
    this.ngZone.run(() => { // Creating a zone for the input field to update when newRoom object is updated
      // https://stackoverflow.com/questions/48860566/ion-input-value-ngmodel-is-not-getting-updated-with-relative-component-membe
      this.newRoom.address = geocode.address.road + ' ' + geocode.address.house_number;
    });
    console.log(geocode);
    console.log(this.newRoom);
  }

}
