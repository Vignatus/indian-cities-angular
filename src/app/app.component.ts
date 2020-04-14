import { Component, OnInit, ViewChild } from '@angular/core';
import { APIService } from './services/api.service';
import { CityModel } from './models/cities.model';
import {} from 'googlemaps';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
    private cityPromise: Promise<CityModel[]>;
    stateCityMapping: {
        [key: string]: CityModel[];
    };
    states: string[];
    stateSelected: string;
    @ViewChild('map') mapElement: any;
    map: google.maps.Map;

    constructor(
        public apiService: APIService
    ) {
        this.stateCityMapping = {};
    }

    ngOnInit():void {
        this.cityPromise = this.apiService.getCities().toPromise();
        this.initialSetup();
    }

    async initialSetup() {
        let cities = await this.cityPromise;
        // console.log(this.cities);
        let unionTerritory = /\*$/;
        for(let city of cities) {
            if (unionTerritory.test(city.State)) {
                city.State = city.State.slice(0,city.State.length-2);
            }
            this.stateCityMapping[city.State] = this.stateCityMapping[city.State] || [];
            this.stateCityMapping[city.State].push(city);
        }
        this.states = Object.keys(this.stateCityMapping).sort();
        cities.length = 0;
    }

    public ngAfterViewInit(): void {
        // Location of India center
        const indiaCent = {lat: 22.0586763, lng: 78.9359167};
        let mapProperties: google.maps.MapOptions = {
            center: indiaCent,
            zoom: 5,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
        }
        debugger;
        this.map = new google.maps.Map(this.mapElement.nativeElement, mapProperties);
    }

}
