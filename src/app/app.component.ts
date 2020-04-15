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
        let cities = this.stateCityMapping[this.stateSelected].slice(0,5);
        console.log(cities);

        for (let i=0; i<cities.length; i++) {
            let city = cities[i];
            if (city.geometry) {
                this.dropMarkerOnMap(city.geometry, city.City);
            } else {
                if (state == this.stateSelected) await this.asyncDropMarkerOnMap(city, state);
            }
        }

        if (state == this.stateSelected) this.recaliberateZoom();
    }

    private async asyncDropMarkerOnMap(city: CityModel, state: string) {
        let address = city.City + ", " + state + ", " + "India";
        let result = await this.apiService.geoCode({
            key: environment.API_KEY,
            address: address,
            region: "in"
        }).toPromise();

        if (!result) {
            console.error("Unable to geocode");
            return;
        }
        city.geometry = result;
        if (state == this.stateSelected) this.dropMarkerOnMap(result, city.City);
    }

    private dropMarkerOnMap(geometry: google.maps.GeocoderGeometry, title: string) {
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

    private recaliberateZoom() {
        for (let i=0; i<this.markerBounds.length; i++) {
            let markerBound = this.markerBounds[i];
            if (i==0) {
                this.zoomBound = markerBound.zoomBound;
                continue;

            }
            this.zoomBound.extend(markerBound.zoomBound.getSouthWest());
            this.zoomBound.extend(markerBound.zoomBound.getNorthEast());
        }
        this.map.fitBounds(this.zoomBound);
    }
    // private drop() {
    //     this.clearMarkers();
    //     for (var i = 0; i < this.markers.length; i++) {
    //       this.addMarkerWithTimeout(this.markers[i], i * 200);
    //     }
    // }

    // private addMarkerWithTimeout(position, timeout) {
    //     window.setTimeout(function() {
    //         this.markers.push(new google.maps.Marker({
    //             title: "dummy",
    //             position: position,
    //             map: this.map,
    //             animation: google.maps.Animation.DROP
    //         }));
    //     }, timeout);
    // }
    private clearMarkers() {
        for (var i = 0; i < this.markerBounds.length; i++) {
          this.markerBounds[i].marker.setMap(null);
        }
        this.markerBounds = [];
    }
}
