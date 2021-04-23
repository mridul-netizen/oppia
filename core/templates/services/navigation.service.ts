// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service for navigating the top navigation bar with
 * tab and shift-tab.
 */


import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

 @Injectable({
   providedIn: 'root'
 })
export class NavigationService {
  constructor() {}
    activeMenuName: string;
    ACTION_OPEN: 'open';
    ACTION_CLOSE: 'close';
    KEYBOARD_EVENT_TO_KEY_CODES: {
      enter: {
        shiftKeyIsPressed: false,
        keyCode: 13
      },
      tab: {
        shiftKeyIsPressed: false,
        keyCode: 9
      },
      shiftTab: {
        shiftKeyIsPressed: true,
        keyCode: 9
      }
    };

    /**
    * Opens the submenu.
    * @param {object} evt
    * @param {String} menuName - name of menu, on which
    * open/close action to be performed (category,language).
    */
    openSubmenu(evt: {
     keyCode: string;
     shiftKey: string;
     currentTarget: string; }, menuName: string): void {
      // Focus on the current target before opening its submenu.
      this.activeMenuName = menuName;
      angular.element(evt.currentTarget).focus();
    }

    closeSubmenu(evt: {
     keyCode: string;
     shiftKey: string;
     currentTarget?: string;
     }): void {
      this.activeMenuName = '';
      angular.element(evt.currentTarget).closest('li')
        .find('a').blur();
    }
    /**
     * Handles keydown events on menus.
     * @param {object} evt
     * @param {String} menuName - name of menu to perform action
     * on(category/language)
     * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
     * corresponding actions to be performed(open/close).
     *
     * @example
     *  onMenuKeypress($event, 'category', {enter: 'open'})
     */
    onMenuKeypress(evt: {
         keyCode: string;
         shiftKey: string;
         currentTarget: string; }, menuName: string, eventsTobeHandled: {
          [key: string]: string; }): void {
      var targetEvents = Object.keys(eventsTobeHandled);
      for (var i = 0; i < targetEvents.length; i++) {
        var keyCodeSpec =
          this.KEYBOARD_EVENT_TO_KEY_CODES[targetEvents[i]];
        if (keyCodeSpec.keyCode === evt.keyCode &&
          evt.shiftKey === keyCodeSpec.shiftKeyIsPressed) {
          if (eventsTobeHandled[targetEvents[i]] === this.ACTION_OPEN) {
            this.openSubmenu(evt, menuName);
          } else if (eventsTobeHandled[targetEvents[i]] ===
            this.ACTION_CLOSE) {
            this.closeSubmenu(evt);
          } else {
            throw new Error('Invalid action type.');
          }
        }
      }
    }
}

angular.module('oppia').factory('NavigationService',
  downgradeInjectable(NavigationService));
