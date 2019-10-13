import { Component, OnInit, IterableDiffers, ViewChild } from '@angular/core';

import { HomeFormComponent } from '../home-form/home-form.component';
import { IeeeService } from 'src/libraries/ieee.service';
import { AcmdlService } from 'src/libraries/acmdl.service';
import { PapersService } from 'src/common/papers.service';
import { MatPaginator } from '@angular/material';
import { SpringerService } from 'src/libraries/springer.service';
import { ScienceDirectService } from 'src/libraries/science-direct.service';

export interface StringBase {
  source: string;
  type: string;
  text: string;
  url: string;
}

@Component({
  selector: 'app-home-form-result',
  templateUrl: './home-form-result.component.html',
  styleUrls: ['./home-form-result.component.css']
})
export class HomeFormResultComponent implements OnInit {
  displayedColumns: string[] = ['source', 'type', 'title', 'DOI', 'year'];  
  displayedColumnsResult: string[] = ['source', 'type', 'total'];

  public dataSource;
  public dataSourcePapers;
  public dataSourceResult;
  private differ: IterableDiffers;

  public baseString: string = '';
  public ieeeString: string = '';
  public ieee: object = {};

  isTitle = true;
  isAbstract = false;
  isKeyword = false;

  isIeee = true;
  isAcm = false;
  isScienceDirect = false;
  isSpringer = false;
  

  constructor(
    private _form: HomeFormComponent,
    private _differs: IterableDiffers,
    private _ieee: IeeeService,
    private _springer: SpringerService,
    private _scienceDirect: ScienceDirectService,
    private _acmdl: AcmdlService,
    public _papers: PapersService
  ) { this.differ = _differs; }

  ngOnInit() {
    this.dataSourcePapers = [];
  }

  public search(): void {
  }


  public checkShowCell(i): boolean {
    if (this.isTitle && (i === 0 || i === 3))
      return true;
    
    if (this.isAbstract && (i === 1 || i === 4))
      return true;

    if (this.isKeyword && (i === 2 || i === 5))
      return true;
    
    if (i === 6)
      return true;
    return false;
  }

  ngDoCheck() {
    const changes = this.differ.find(this._form.generalTerms);
    if (changes) {
      this.baseString = this._form.baseString;
      this.formatIeee();
    }

    const changes2 = this.differ.find(this._papers.papers);
    if (changes2){
      this.convertToData();
    }
  }

  private convertToData(): void {
    this.dataSourceResult = [];
    for (let i = 0; i < this._papers.result.length; i++) {
      var result = this._papers.result[i];
      this.dataSourceResult[i] = {
        "source": result.source,
        "type": result.type,
        "total": result.total,
      }
    }
    

    this.dataSourcePapers = [];
    for (let i = 0; i < this._papers.papers.length; i++) {
      var paperAux = this._papers.papers[i];
      this.dataSourcePapers[i] = {
        "source": paperAux.source,
        "type": paperAux.type,
        "title": paperAux.title,
        "DOI": paperAux.DOI,
        "year": paperAux.year
      }      
    }
  }

  private replaceAll(text: string, oldChar: string, newChar: string): string {
    return text.split(oldChar).join(newChar);
  }
  
  private countEndParenthesis(text: string): number {
    return text.split(')').length - 1;   
  }

  private removeBaseParenthesis(): string {
    let base = this.replaceAll(this.baseString, '(', '');
    base = this.replaceAll(base, ')', '');
    return base;
  }


  /**
   * IEEEXplore
   */
  private formatIeee(): void {
    let ieeeBase = this.removeBaseParenthesis();
    ieeeBase = this.addParenthesisInEndIeee(ieeeBase);
    ieeeBase = this.addParenthesisInStartIeee(ieeeBase);
    this.addKeysIeee(ieeeBase);
  }

  private addParenthesisInEndIeee(ieeeBase: string): string {
    ieeeBase = this.replaceAll(ieeeBase, ' OR ', ') OR ');
    ieeeBase = this.replaceAll(ieeeBase, ' AND ', ') AND ');
    return `${ieeeBase})`;
  }

  private addParenthesisInStartIeee(ieeeBase: string): string {
    let countParenthesis = this.countEndParenthesis(ieeeBase);
    let stringBase = ``;
    for (let i = 0; i < countParenthesis; i++)
      stringBase += `(`;
    return `${stringBase}#change#${ieeeBase}`;
  }

  private addKeysIeee(ieeeBase: string): void {
    let title = this.utilFormatterKeysIeee(ieeeBase, '"Document Title"');
    let abstract = this.utilFormatterKeysIeee(ieeeBase, '"Abstract"');
    let keyword = this.utilFormatterKeysIeee(ieeeBase, '"Index Terms"');
    let url = `https://ieeexplore.ieee.org/search/searchresult.jsp?action=search&matchBoolean=true&searchField=Search_All&queryText=(#query#)&newsearch=true`;
    
    this.dataSource = [
      {
        'source': 'IEEE Xplore',
        'type': 'Title',
        'text': title,
        'url': url.replace('#query#', title)
      },{
        'source': 'IEEE Xplore',
        'type': 'Abstract',
        'text': abstract,
        'url': url.replace('#query#', abstract)
      },{
        'source': 'IEEE Xplore',
        'type': 'Keywords',
        'text': keyword,
        'url': url.replace('#query#', keyword)
      }
    ];

    this.ieeeString = ieeeBase;
  }

  private utilFormatterKeysIeee(ieeeBase: string, key: string): string {
    ieeeBase = ieeeBase.replace('#change#', `${key}:`);
    ieeeBase = this.replaceAll(ieeeBase, ' OR ', ` OR ${key}:`);
    ieeeBase = this.replaceAll(ieeeBase, ' AND ', ` AND ${key}:`);
    return ieeeBase;
  }


  public searchInSources(): void {
    this.dataSourcePapers = [];
    this._papers.papers = [];
    this._papers.result = [];
    if (this.isSpringer)
      this.searchInSpringer();
    
    if (this.isScienceDirect)
      this.searchInScienceDirect();
    
    if (this.isAcm)
      this.searchInACM();    
  }

  private searchInSpringer(): void {
    this._springer.Search(this.baseString);
  }
  
  private searchInScienceDirect(): void {
    this._scienceDirect.Search(this.baseString);
  }

  private searchInACM(): void {
    if (this.isTitle)
      this._acmdl.Search(this._form.baseString, "title");
    if (this.isAbstract)
      this._acmdl.Search(this._form.baseString, "abstract");
    if (this.isKeyword)
      this._acmdl.Search(this._form.baseString, "keyword");
  }

}