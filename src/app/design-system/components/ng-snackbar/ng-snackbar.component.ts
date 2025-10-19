import { ChangeDetectionStrategy, Component, inject, Input, OnChanges } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'ng-snackbar',
  imports: [MatSnackBarModule],
  templateUrl: './ng-snackbar.component.html',
  styleUrl: './ng-snackbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgSnackbarComponent implements OnChanges {
  private readonly _snackBar = inject(MatSnackBar);

  @Input({ required: true }) message: string = '';
  @Input() duration: number = 2500;
  @Input() horizontalPosition: 'center' | 'end' | 'left' | 'right' | 'start' = 'center';
  @Input() verticalPosition: 'bottom' | 'top' = 'bottom';


  ngOnChanges(): void {
    if (this.message) {
      this._snackBar.open(this.message, 'Close', {
        duration: this.duration,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
    }
  }

}
