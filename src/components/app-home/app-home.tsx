import { FileInfo } from '@limetech/lime-elements';
import { Component, h, State } from '@stencil/core';
import XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

type Registration = {
  Förnamn: string;
  Efternamn: string;
  Sportident: string;
  Klubb: string;
  Klass: string;
  'Person-id': string;
};

type SIDroidRunner = {
  Sportident: string;
  Name: string;
  Club: string;
  Id: string;
  Course: string;
}

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss',
  shadow: true,
})
export class AppHome {
  @State()
  private eventorId: string;

  @State()
  private file: FileInfo;

  @State()
  private runners: SIDroidRunner[];

  private columns = [
    {
      title: 'Sportident',
      field: 'Sportident',
    },
    {
      title: 'Namn',
      field: 'Name',
      component: {
        name: 'result-table-component',
        props: { style: '--min-width: 14rem' },
      },
    },
    {
      title: 'Klubb',
      field: 'Club',
      component: {
        name: 'result-table-component',
        props: { style: '--min-width: 14rem' },
      },
    },
    { title: 'Eventor Id', field: 'Id' },
    {
      title: 'Bana',
      field: 'Course',
      component: {
        name: 'result-table-component',
        props: { style: '--min-width: 14rem' },
      },
    },
  ];

  constructor() {
    this.updateExcelLink = this.updateExcelLink.bind(this);
    this.downloadExcelFile = this.downloadExcelFile.bind(this);
    this.fileSelected = this.fileSelected.bind(this);
    this.downloadRunnersFile = this.downloadRunnersFile.bind(this);
  }

  render() {
    return (
      <div class="app-home">
        <p>Ett sätt att använda SI Droid bygger på att man använder anmälningslistan från en aktivitet i Eventor för att koppla ihop en löparbricka med en bana.</p>
        <p>Detta är framförallt fördelaktigt när flera banor har samma stämplingsenheter, t.ex. när endast start- och målenhet används.</p>
        <strong>Gör så här för att ladda in lista med löpare från Eventor.</strong>
        <h3>1. Ladda ner anmälningsöversikten som Excel-fil</h3>
        <p>Klistra in länk till aktiviteten eller fyll i dess ID här, och klicka sedan på knappen för att ladda ner filen.</p>
        <limel-input-field label="Eventor URL/ID    " onChange={this.updateExcelLink} />
        {this.eventorId && [
          <p>
            <limel-button primary={true} onClick={this.downloadExcelFile} label="Ladda ner" />
          </p>,
          <p>
            <em>Om inget händer kan det bero på att du inte är inloggad på Eventor. Då kan du klicka på länken nedan istället.</em>
          </p>,
          <a target="_blank" href={`https://eventor.orientering.se/EventAdmin/EntryOverview/${this.eventorId}`}>
            Öppna anmälningsöversikten i ny flik
          </a>,
        ]}
        <h3>2. Skapa fil med löpare till SI Droid</h3>

        <limel-file label="Excel-fil    " onChange={this.fileSelected} value={this.file} />

        <h3>3. Granska och spara löparfilen</h3>

        {!this.file && <em>Välj filen "Entry overview nnnnn.xls" från Eventor ovan för att granska</em>}

        {this.file && [
          <limel-table
            data={this.runners || []}
            columns={this.columns}
          />,
          <p>
            <limel-button primary={true} onClick={this.downloadRunnersFile} label="Ladda ner löparfilen" />
          </p>,
          <p>
            <a href="http://www.joja.se/index.php?title=Generating_a_lookup_file_for_runners#Import_file_into_SI-Droid_Event">
              Läs mer: Instruktion för att välja löparfil i SI Droid
            </a>
          </p>
        ]}
      </div>
    );
  }

  updateExcelLink(ev) {
    const match = ev.detail.match(/\d+/);
    let eventorId = '';
    if (match.length) {
      eventorId = match[0];
    }

    this.eventorId = eventorId;
  }

  downloadExcelFile() {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument;
    const a = idoc.createElement('a');
    a.download = `Entry overview ${this.eventorId}.xls`;
    a.href = `https://eventor.orientering.se/EventAdmin/ExportEntryOverviewToExcel/${this.eventorId}?includeSubEvents=False`;
    idoc.body.appendChild(a);
    a.click();
    idoc.body.removeChild(a);
    document.body.removeChild(iframe);
  }

  fileSelected(ev: CustomEvent<FileInfo>) {
    this.file = ev.detail;

    if (!this.file) {
      this.runners = [];
      return;
    }

    let filenameMatch;
    if (!this.eventorId && (filenameMatch = this.file.filename.match(/(\d+)\.xls$/))) {
      this.eventorId = filenameMatch[1];
    }

    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheet = workbook.Sheets['Anmälningar'];
      const registrations: Registration[] = this.sortByCourseAndName(
        XLSX.utils.sheet_to_json(sheet)
      );
      this.runners = registrations.map(this.registrationEntryToSIDroidRunner);
    };
    reader.readAsArrayBuffer(this.file.fileContent);
  }

  registrationEntryToSIDroidRunner(registration: Registration): SIDroidRunner {
    return {
      Sportident: registration.Sportident,
      Name: `${registration.Förnamn} ${registration.Efternamn}`,
      Club: registration.Klubb,
      Id: registration['Person-id'],
      Course: registration.Klass,
    };
  }

  sortByCourseAndName(runners: Registration[]) {
    return runners.sort((a, b) => {
      const course = a.Klass.localeCompare(b.Klass);
      return course === 0 ? a.Efternamn.localeCompare(b.Efternamn) : course;
    })
  }

  downloadRunnersFile() {
    const csv = Papa.unparse({
      data: this.runners,
      columns: [
        'Sportident',
        'Name',
        'Club',
        'Id',
        'Course'
      ]
    });

    const filename = `runners_${this.eventorId || dayjs().format('YYYYMMDD')}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, filename);
  }
}
