import { newSpecPage } from '@stencil/core/testing';
import { ResultTableComponent } from './result-table-component';

describe('result-table-component', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [ResultTableComponent],
      html: `<result-table-component></result-table-component>`,
    });
    expect(page.root).toEqualHtml(`
      <result-table-component>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </result-table-component>
    `);
  });
});
