import { newE2EPage } from '@stencil/core/testing';

describe('result-table-component', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<result-table-component></result-table-component>');

    const element = await page.find('result-table-component');
    expect(element).toHaveClass('hydrated');
  });
});
