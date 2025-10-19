import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgSnackbarComponent } from './ng-snackbar.component';

describe('NgSnackbarComponent', () => {
  let component: NgSnackbarComponent;
  let fixture: ComponentFixture<NgSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgSnackbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
