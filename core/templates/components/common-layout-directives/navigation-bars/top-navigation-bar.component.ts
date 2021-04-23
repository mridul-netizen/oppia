// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS O = null KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the top navigation bar. This excludes the part
 * of the navbar that is used for local navigation (such as the various tabs in
 * the editor pages).
 */

import { Subscription } from 'rxjs';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { SidebarStatusService } from 'services/sidebar-status.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DebouncerService } from 'services/debouncer.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserService } from 'services/user.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { SearchService } from 'services/search.service';
import { NavigationService } from 'services/navigation.service';
import { AppConstants } from 'app.constants';
import { HttpClient } from '@angular/common/http';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'top-navigation-bar',
  templateUrl: './top-navigation-bar.component.html',
})
export class TopNavigationBarComponent implements OnInit, OnDestroy {
   @Input() headerText;
   @Input() subheaderText;
   isModerator: boolean;
   isAdmin: boolean;
   isTopicManager: boolean;
   isSuperAdmin: boolean;
   userIsLoggedIn: boolean;
   username: string;
   currentUrl: string;
   LABEL_FOR_CLEARING_FOCUS: string;
   logoutUrl: string;
   userMenuIsShown: boolean;
   inClassroomPage: boolean;
   standardNavIsShown: boolean;
   ACTION_OPEN: string;
   ACTION_CLOSE: string;
   KEYBOARD_EVENT_TO_KEY_CODES: {
      enter: {
         shiftKeyIsPressed: false;
         keyCode: 13;
         };
      tab: {
         shiftKeyIsPressed: false;
         keyCode: 9;
         };
      shiftTab: {
        shiftKeyIsPressed: true;
        keyCode: 9;
       };
      };
   windowIsNarrow: boolean = false;
   activeMenuName: string;
   profilePageUrl: string;
   numUnseenNotifications: string | number;
   profilePictureDataUrl: string;
   sidebarIsShown: boolean;
   directiveSubscriptions = new Subscription();
   NAV_MODE_SIGNUP = 'signup';
   NAV_MODES_WITH_CUSTOM_LOCAL_NAV = [
     'create', 'explore', 'collection', 'collection_editor',
     'topics_and_skills_dashboard', 'topic_editor', 'skill_editor',
     'story_editor'];
   currentWindowWidth = this.windowDimensionsService.getWidth();
   // The order of the elements in this array specifies the order in
   // which they will be hidden. Earlier elements will be hidden first.
   NAV_ELEMENTS_ORDER = [
     'I18N_TOPNAV_DONATE', 'I18N_TOPNAV_CLASSROOM', 'I18N_TOPNAV_ABOUT',
     'I18N_CREATE_EXPLORATION_CREATE', 'I18N_TOPNAV_LIBRARY'];

   CLASSROOM_PROMOS_ARE_ENABLED = false;
   googleSignInIconUrl = this.urlInterpolationService.getStaticImageUrl(
     '/google_signin_buttons/google_signin.svg');
   navElementsVisibilityStatus ={};

   constructor(
     private classroomBackendApiService: ClassroomBackendApiService,
     private sidebarStatusService: SidebarStatusService,
     private urlInterpolationService: UrlInterpolationService,
     private debouncerService: DebouncerService,
     private navigationService: NavigationService,
     private siteAnalyticsService: SiteAnalyticsService,
     private userService: UserService,
     private deviceInfoService: DeviceInfoService,
     private windowDimensionsService: WindowDimensionsService,
     private searchService: SearchService,
     private http: HttpClient,
     private i18nLanguageCodeService: I18nLanguageCodeService,
     private windowRef: WindowRef,
   ) {}

   ngOnInit(): void {
     this.getProfileImageDataAsync();
     this.currentUrl = window.location.pathname.split('/')[1];
     this.LABEL_FOR_CLEARING_FOCUS = AppConstants.LABEL_FOR_CLEARING_FOCUS;
     this.logoutUrl = AppConstants.LOGOUT_URL;
     this.userMenuIsShown = (this.currentUrl !== this.NAV_MODE_SIGNUP);
     this.inClassroomPage = false;
     this.standardNavIsShown = (
       this.NAV_MODES_WITH_CUSTOM_LOCAL_NAV.indexOf(this.currentUrl) === -1);
     if (this.currentUrl === 'learn') {
       this.inClassroomPage = true;
     }
     this.ACTION_OPEN = this.navigationService.ACTION_OPEN;
     this.ACTION_CLOSE = this.navigationService.ACTION_CLOSE;
     this.KEYBOARD_EVENT_TO_KEY_CODES =
       this.navigationService.KEYBOARD_EVENT_TO_KEY_CODES;
     this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();

     let service = this.classroomBackendApiService;
     service.fetchClassroomPromosAreEnabledStatusAsync().then(
       (classroomPromosAreEnabled) => {
         this.CLASSROOM_PROMOS_ARE_ENABLED = classroomPromosAreEnabled;
       });

     // Close the submenu if focus or click occur = nullwhere outside of
     // the menu or outside of its parent (which opens submenu on hover).
     angular.element(document).on('click', (evt) => {
       if (!angular.element(evt.target).closest('li').length) {
         this.activeMenuName = '';
       }
     });

     this.directiveSubscriptions.add(
       this.searchService.onSearchBarLoaded.subscribe(
         () => {
           setTimeout(this.truncateNavbar, 100);
         }
       )
     );

     this.userService.getUserInfoAsync().then((userInfo) => {
       if (userInfo.getPreferredSiteLanguageCode()) {
         // This.translate.use(userInfo.getPreferredSiteLanguageCode());
         this.i18nLanguageCodeService.setI18nLanguageCode(
           userInfo.getPreferredSiteLanguageCode());
       }
       this.isModerator = userInfo.isModerator();
       this.isAdmin = userInfo.isAdmin();
       this.isTopicManager = userInfo.isTopicManager();
       this.isSuperAdmin = userInfo.isSuperAdmin();
       this.userIsLoggedIn = userInfo.isLoggedIn();
       this.username = userInfo.getUsername();
       if (this.username) {
         this.profilePageUrl = this.urlInterpolationService.interpolateUrl(
           '/profile/<username>', {
             username: this.username
           });
       }

       if (this.userIsLoggedIn) {
         // Show the number of unseen notifications in the navbar and
         // page title, unless the user is already on the dashboard page.
         this.http.get('/notificationshandler').toPromise().then(
           (response) => {
             if (this.windowRef.nativeWindow.location.pathname !== '/') {
               this.numUnseenNotifications =
              response.num_unseen_notifications;
               if (this.numUnseenNotifications > 0) {
                 this.windowRef.nativeWindow.document.title = (
                   '(' + this.numUnseenNotifications + ') ' +
                 this.windowRef.nativeWindow.document.title);
               }
             }
           });
       }
     });

     for (var i = 0; i < this.NAV_ELEMENTS_ORDER.length; i++) {
       this.navElementsVisibilityStatus[this.NAV_ELEMENTS_ORDER[i]] = true;
     }

     this.directiveSubscriptions.add(
       this.windowDimensionsService.getResizeEvent().subscribe(evt => {
         this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
         // If window is resized larger, try displaying the hidden
         // elements.
         if (
           this.currentWindowWidth < this.windowDimensionsService.getWidth()) {
           for (var i = 0; i < this.NAV_ELEMENTS_ORDER.length; i++) {
             if (
               !this.navElementsVisibilityStatus[
                 this.NAV_ELEMENTS_ORDER[i]]) {
               this.navElementsVisibilityStatus[this.NAV_ELEMENTS_ORDER[i]] =
                 true;
             }
           }
         }

         // Close the sidebar, if necessary.
         this.sidebarStatusService.closeSidebar();
         this.sidebarIsShown = this.sidebarStatusService.isSidebarShown();
         this.currentWindowWidth = this.windowDimensionsService.getWidth();
         this.debouncerService.debounce(this.truncateNavbar, 500);
       })
     );
     // The function needs to be run after i18n. A timeout of 0 appears
     // to run after i18n in Chrome, but not other browsers. The
     // will check if i18n is complete and set a new timeout if it is
     // not. Since a timeout of 0 works for at least one browser,
     // it is used here.
     setTimeout(this.truncateNavbar, 0);
   }

   async getProfileImageDataAsync(): Promise<void> {
     let dataUrl = await this.userService.getProfileImageDataUrlAsync();
     this.profilePictureDataUrl = decodeURIComponent(dataUrl);
   }


   getStaticImageUrl(imagePath: string): string {
     return this.urlInterpolationService.getStaticImageUrl(imagePath);
   }

   onLoginButtonClicked(): void {
     this.userService.getLoginUrlAsync().then(
       (loginUrl) => {
         if (loginUrl) {
           this.siteAnalyticsService.registerStartLoginEvent('loginButton');
           setTimeout(() => {
             this.windowRef.nativeWindow.location.href = loginUrl;
           }, 150);
         } else {
           this.windowRef.nativeWindow.location.reload();
         }
       }
     );
   }
   onLogoutButtonClicked(): void {
     this.windowRef.nativeWindow.localStorage.removeItem(
       'last_uploaded_audio_lang');
   }
   /**
     * Opens the submenu.
     * @param {object} evt
     * @param {String} menuName - name of menu, on which
     * open/close action to be performed (aboutMenu,profileMenu).
     */
   openSubmenu(evt: {
    keyCode: string;
    shiftKey: string;
    currentTarget: string; }, menuName: string): void {
     // Focus on the current target before opening its submenu.
     this.navigationService.openSubmenu(evt, menuName);
   }

   blurNavigationLinks(evt: Event): void {
     // This is required because if about submenu is in open state
     // and when you hover on library, both will be highlighted,
     // To avoid that, blur all the a's in nav, so that only one
     // will be highlighted.
     $('nav a').blur();
   }

   closeSubmenu(evt: {
    keyCode: string;
    shiftKey: string;
    currentTarget: string; }): void {
     this.navigationService.closeSubmenu(evt);
   }

   closeSubmenuIfNotMobile(evt: {
    keyCode: string;
    shiftKey: string;
    currentTarget: string; }): void {
     if (this.deviceInfoService.isMobileDevice()) {
       return;
     }
     this.closeSubmenu(evt);
   }
   /**
     * Handles keydown events on menus.
     * @param {object} evt
     * @param {String} menuName - name of menu to perform action
     * on(aboutMenu/profileMenu)
     * @param {object} eventsTobeHandled - Map keyboard events('Enter')
     * to corresponding actions to be performed(open/close).
     *
     * @example
     *  onMenuKeypress($event, 'aboutMenu', {enter: 'open'})
     */
   onMenuKeypress(evt: {
    keyCode: string;
    shiftKey: string;
    currentTarget: string; }, menuName: string, eventsTobeHandled: {
       [key: string]: string; }): void {
     this.navigationService.onMenuKeypress(
       evt, menuName, eventsTobeHandled);
     this.activeMenuName = this.navigationService.activeMenuName;
   }

   isSidebarShown(): boolean {
     return this.sidebarStatusService.isSidebarShown();
   }

   toggleSidebar(): void {
     this.sidebarStatusService.toggleSidebar();
   }

   navigateToClassroomPage(classroomUrl: string): void {
     this.siteAnalyticsService.registerClassoomHeaderClickEvent();
     setTimeout(() => {
       this.windowRef.nativeWindow.location.href = classroomUrl;
     }, 150);
   }

   /**
     * Checks if i18n has been run.
     * If i18n has not yet run, the <a> and <span> tags will have
     * no text content, so their innerText.length value will be 0.
     * @returns {boolean}
     */
   checkIfI18NCompleted(): boolean {
     var i18nCompleted = true;
     var tabs = document.querySelectorAll('.oppia-navbar-tab-content');
     for (var i = 0; i < tabs.length; i++) {
       if ((<HTMLElement>tabs[i]).innerText.length === 0) {
         i18nCompleted = false;
         break;
       }
     }
     return i18nCompleted;
   }

   /**
     * Checks if window is >768px and i18n is completed, then checks
     * for overflow. If overflow is detected, hides the least important
     * tab and then calls itself again after a 50ms delay.
     */
   truncateNavbar(): void {
     // If the window is narrow, the standard nav tabs are not shown.
     if (this.windowDimensionsService?.isWindowNarrow()) {
       return;
     }

     // If i18n hasn't completed, retry after 100ms.
     if (!this.checkIfI18NCompleted) {
       setTimeout(this.truncateNavbar, 100);
       return;
     }

     // The value of 60px used here comes from measuring the normal
     // height of the navbar (56px) in Chrome's inspector and rounding
     // up. If the height of the navbar is changed in the future this
     // will need to be updated.
     if (document.querySelector('div.collapse.navbar-collapse')
       .clientHeight > 60) {
       for (var i = 0; i < this.NAV_ELEMENTS_ORDER.length; i++) {
         if (
           this.navElementsVisibilityStatus[this.NAV_ELEMENTS_ORDER[i]]) {
           // Hide one element, then check again after 50ms.
           // This gives the browser time to render the visibility
           // change.
           this.navElementsVisibilityStatus[this.NAV_ELEMENTS_ORDER[i]] =
                         false;
           // Force a digest cycle to hide element immediately.
           // Otherwise it would be hidden after the next call.
           // This is due to setTimeout use in debounce.
           setTimeout(this.truncateNavbar, 50);
           return;
         }
       }
     }
   }

   ngOnDestroy(): void {
     this.directiveSubscriptions.unsubscribe();
   }
}

angular.module('oppia').directive(
  'topNavigationBar', downgradeComponent(
    {component: TopNavigationBarComponent}));
