import { HypermediaClientService } from './../hypermedia-view/hypermedia-client.service';
import { Component, OnInit, Input } from '@angular/core';
import {FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {

  private readonly URL_REGEX = /^http[s]?:\/\/\w+(\.\w+)*(:[0-9]+)?\/?(\/[.\w]*)*$/;

  public urlFormControl: FormControl;

  @Input() apiEntryPoint: string = null;

  constructor(private hypermediaClientService: HypermediaClientService ) {
    this.apiEntryPoint = 'http://localhost:5000/EntryPoint';

    this.urlFormControl = new FormControl('', [
      Validators.required,
      Validators.pattern(this.URL_REGEX)
    ]);
  }

  ngOnInit() {
  }

  navigate() {
    this.hypermediaClientService.Navigate(this.apiEntryPoint);
  }

}
