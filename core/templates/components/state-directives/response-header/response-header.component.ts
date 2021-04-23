// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the header of the response tiles.
 */

import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { EditabilityService } from 'services/editability.service';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';

interface EventData {
  event: Event;
  index: number
}
@Component({
  selector: 'oppia-response-header',
  templateUrl: './response-header.component.html'
})
export class ResponseHeaderComponent {
  @Input() index: number;
  @Input() outcome: Outcome;
  @Input() summary: string;
  @Input() shortSummary: string;
  @Input() isActive: boolean;
  @Output() onDeleteFn: EventEmitter<EventData> = (new EventEmitter());
  @Input() numRules: number;
  @Input() isResponse: boolean;
  @Input() showWarning: boolean;
  @Input() navigateToState: string;
  editabilityService: EditabilityService;

  constructor(
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
  ) {}

  isInQuestionMode(): boolean {
    return this.stateEditorService.isInQuestionMode();
  }

  getCurrentInteractionId(): string {
    return this.stateInteractionIdService.savedMemento;
  }

  isCorrectnessFeedbackEnabled(): boolean {
    return this.stateEditorService.getCorrectnessFeedbackEnabled();
  }
  // This returns false if the current interaction ID is null.
  isCurrentInteractionLinear(): void {
    let interactionId = this.getCurrentInteractionId();
    return interactionId && INTERACTION_SPECS[interactionId].is_linear;
  }

  isCorrect(): boolean {
    return this.outcome && this.outcome.labelledAsCorrect;
  }

  isOutcomeLooping(): boolean {
    let activeStateName = this.stateEditorService.getActiveStateName();
    return this.outcome && (this.outcome.dest === activeStateName);
  }

  isCreatingNewState(): boolean {
    let outcome = this.outcome;
    return outcome && outcome.dest === AppConstants.PLACEHOLDER_OUTCOME_DEST;
  }

  deleteResponse(evt: Event): void {
    let eventData = {
      index: this.index,
      event: evt
    };
    this.onDeleteFn.emit(eventData);
  }
  ngOnInit(): void {
    this.editabilityService = new EditabilityService();
  }
}

angular.module('oppia').directive(
  'oppiaResponseHeader', downgradeComponent(
    {component: ResponseHeaderComponent}));
