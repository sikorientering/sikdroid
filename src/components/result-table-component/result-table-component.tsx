import { Component, Prop } from '@stencil/core';
import { TableComponent } from '@limetech/lime-elements';

@Component({
  tag: 'result-table-component',
  styleUrl: 'result-table-component.scss',
  shadow: true,
})
export class ResultTableComponent implements TableComponent<any> {
  /**
   * Name of the field for the column
   */
  @Prop()
  public field: string;

  /**
   * The value to display in the table cell
   */
  @Prop()
  public value: any;

  /**
   * Data for the whole row
   */
  @Prop()
  public data: any;

  public render() {
    return this.value !== Number.MAX_VALUE && this.value || '';
  }
}
