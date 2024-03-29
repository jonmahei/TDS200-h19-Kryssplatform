import { RoomCardComponent } from './../components/room-card/room-card.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import IRoom from '../models/IRoom';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform, ModalController, AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/firestore';
import { DatepickerPage } from '../modals/datepicker/datepicker.page';
import { Location } from '@angular/common';
import { ToastService } from '../services/toast.service';
import IUser from '../models/IUser';


export interface IRoomId extends IRoom { id: string; }

@Component({
  selector: 'app-room-details',
  templateUrl: './room-details.page.html',
  styleUrls: ['./room-details.page.scss'],
})
export class RoomDetailsPage implements OnInit {

  @ViewChild(RoomCardComponent, null) roomCard: RoomCardComponent;

  public user: IUser;
  public roomData: IRoom;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private firestore: AngularFirestore,
    private modalcontroller: ModalController,
    private location: Location,
    private toast: ToastService,
    private alertcontroller: AlertController
  ) {
    this.route.queryParams.subscribe(_ => {
      if (this.router.getCurrentNavigation().extras.state) {
        this.roomData = this.router.getCurrentNavigation().extras.state.roomData as IRoom;
        this.user = this.router.getCurrentNavigation().extras.state.user as IUser;
      }
    });
  }

  ngOnInit() {
  }

  async showDateModal() {
    const modal = await this.modalcontroller.create({
      component: DatepickerPage,
      componentProps: {
        fromDate: this.roomData.fromDate,
        toDate: this.roomData.toDate,
        newRoom: false
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data.status === 'ok') {
      // handle dates
      const dates = {
        fromDate: data.fromDate,
        toDate: data.toDate
      };
      this.location.back();
      this.bookRoom(dates);
    }
  }

  async bookRoom(dates: any) {
    // TODO: implement support for dates booked.
    const roomRef = this.firestore.collection<IRoom>('rooms').doc(this.roomData.id);
    return roomRef.update({
      available: false
    }).then(() => this.toast.show('Room booked!', 3000));
  }

  async deleteRoom() {
    const alert = await this.alertcontroller.create({
      header: 'Remove room?',
      message: 'Sure you want to remove this room?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: `I'm sure`,
          role: 'delete',
          handler: async () => {
            await this.deleteFromDb();
          }
        }
      ]
    });
    await alert.present();

  }

  async rate() {
    this.roomCard.showRatingModal();
  }

  private async deleteFromDb() {
    try {
      const roomRef = this.firestore.collection<IRoom>('rooms').doc(this.roomData.id);
      await roomRef.delete().then(() => {
        this.location.back();
        this.toast.show(`Room: ${this.roomData.title} removed.`, 2000);
      });
    } catch (error) {
      this.toast.show(error, 3000);
    }
  }

  showOnMap() {
    const location = `${this.roomData.lat},${this.roomData.long}`;
    if (this.platform.is('android')) {
      window.open('geo:0,0?q=' + location, '_system');
    } else {
      window.open('maps://?q=' + location, '_system');
    }
  }
}
