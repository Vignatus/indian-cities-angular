import { Component, OnInit, ViewChild } from '@angular/core';
import { APIService } from './services/api.service';
import { CityModel } from './models/cities.model';
import {} from 'googlemaps';
import * as _ from 'lodash';
import { environment } from 'src/environments/environment';

declare interface MarkerBound {
    marker: google.maps.Marker;
    zoomBound: google.maps.LatLngBounds;
}

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
    private markerBounds: MarkerBound[];
    private zoomBound: google.maps.LatLngBounds;
    private defaultZoomBound: google.maps.LatLngBounds;

    constructor(
        public apiService: APIService
    ) {
        this.stateCityMapping = {};
    }

    ngOnInit():void {
        this.cityPromise = this.apiService.getCities().toPromise();
        this.initialSetup();
        this.markerBounds = [];
    }

    async initialSetup() {
        let cities = await this.cityPromise;
        // To remove * from the end of Union Territories
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
        this.map = new google.maps.Map(this.mapElement.nativeElement, mapProperties);
        google.maps.event.addListenerOnce(this.map, 'idle', ()=>{
            this.defaultZoomBound = this.map.getBounds();
            this.zoomBound = this.defaultZoomBound;
        })
    }

    public async onStateSelection() {
        this.clearMarkers();
        this.map.fitBounds(this.defaultZoomBound);
        let state = this.stateSelected;
        let cities = this.stateCityMapping[this.stateSelected];

        for (let i=0; i<cities.length; i++) {
            let city = cities[i];
            if (city.geometry) {
                this.dropMarkerOnMap(city.geometry, city.City, cities.length-1 == i);
            } else {
                this.asyncDropMarkerOnMap(city, state, cities.length-1 == i);
            }
        }
    }

    private async asyncDropMarkerOnMap(city: CityModel, state: string, isLast: boolean) {
        let address = city.City + ", " + state + ", " + "India";
        let result = await this.apiService.geoCode({
            key: environment.API_KEY,
            address: address,
            region: "in"
        }).toPromise();

        if (!result) {
            console.error("Unable to geocode");
        }
        city.geometry = result;
        if (state == this.stateSelected) this.dropMarkerOnMap(result, city.City, isLast);
    }

    private dropMarkerOnMap(geometry: google.maps.GeocoderGeometry | null, title: string, isLast: boolean) {
        if (geometry) {
            let marker = new google.maps.Marker({
                title: title,
                position: geometry.location.toJSON(),
                map: this.map,
                animation: google.maps.Animation.DROP
            });
            let markerBound:MarkerBound = {
                marker: marker,
                zoomBound: geometry.viewport
            }
            this.markerBounds.push(markerBound);
        }
        console.log("isLast: " + isLast + " Array length: " + this.markerBounds.length);
        if (isLast) window.setTimeout(this.recaliberateZoom, 300, this);
    }

    private recaliberateZoom(that?: this) {
        that = that ? that : this;
        for (let i=0; i<that.markerBounds.length; i++) {
            let markerBound = that.markerBounds[i];
            if (i==0) {
                that.zoomBound = markerBound.zoomBound;
                continue;

            }
            that.zoomBound.extend(markerBound.zoomBound.getSouthWest());
            that.zoomBound.extend(markerBound.zoomBound.getNorthEast());
        }
        that.map.fitBounds(that.zoomBound);
    }

    private clearMarkers() {
        for (var i = 0; i < this.markerBounds.length; i++) {
          this.markerBounds[i].marker.setMap(null);
        }
        this.markerBounds = [];
    }
}
