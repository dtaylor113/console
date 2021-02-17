import { checkErrors, testName } from '../../support';
import { listPage } from '../../views/list-page';
import { detailsPage } from '../../views/details-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import { projectDropdown } from '../../views/common';
import * as yamlEditor from '../../views/yaml-editor';
import { errorMessage } from '../../views/form';

const createExampleRole = () => {
  nav.sidenav.clickNavLink(['User Management', 'Roles']);
  listPage.rows.shouldBeLoaded();
  listPage.clickCreateYAMLbutton();
  // sidebar needs to be fully loaded, else it sometimes overlays the Create button
  cy.byTestID('resource-sidebar').should('exist');
  yamlEditor.isLoaded();
  yamlEditor.clickSaveCreateButton();
  cy.get(errorMessage).should('not.exist');
  detailsPage.breadcrumb(0).click();
};

const deleteExampleRole = () => {
  nav.sidenav.clickNavLink(['User Management', 'Roles']);
  listPage.rows.shouldBeLoaded();
  listPage.filter.byName('example');
  listPage.rows.clickKebabAction('example', 'Delete Role');
  modal.shouldBeOpened();
  modal.submit();
  modal.shouldBeClosed();
  cy.resourceShouldBeDeleted('default', 'Role', 'example');
};

describe('Namespace', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
    createExampleRole();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    deleteExampleRole();
    cy.deleteProject(testName);
    cy.logout();
  });

  const newName = `${testName}-ns`;
  const defaultProjectName = 'default';
  const allProjectsDropdownLabel = 'All Projects';

  it('lists, creates, and deletes', () => {
    cy.log('test Namespace list page');
    cy.visit('/k8s/cluster/namespaces');
    listPage.rows.shouldNotExist(newName);
    listPage.filter.byName(testName);
    listPage.rows.shouldExist(testName); // created via cy.createProject(testName) above
    cy.testA11y('Namespace List page');

    cy.log('creates the Namespace');
    listPage.clickCreateYAMLbutton();
    modal.shouldBeOpened();
    cy.byTestID('input-name').type(newName);
    cy.testA11y('Create Namespace modal', '#modal-container');
    modal.submit();
    modal.shouldBeClosed();
    cy.url().should('include', `/k8s/cluster/namespaces/${newName}`);

    cy.log('delete the Namespace');
    cy.visit('/k8s/cluster/namespaces');
    listPage.filter.byName(newName);
    listPage.rows.shouldExist(newName);
    listPage.rows.clickKebabAction(newName, 'Delete Namespace');
    modal.shouldBeOpened();
    cy.byTestID('project-name-input').type(newName);
    cy.testA11y('Delete Namespace modal', '#modal-container');
    modal.submit();
    modal.shouldBeClosed();
    cy.resourceShouldBeDeleted(testName, 'namespaces', newName);
  });

  it('nav and breadcrumbs restores last selected "All Projects" when navigating from details to list view', () => {
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    listPage.rows.shouldBeLoaded();
    projectDropdown.selectProject(allProjectsDropdownLabel);
    projectDropdown.shouldContain(allProjectsDropdownLabel);
    cy.log(
      'Nav from list page to details page should change Project from "All Projects" to resource specific project',
    );
    listPage.filter.byName('alertmanager-main');
    listPage.rows.clickRowByName('alertmanager-main');
    detailsPage.isLoaded();
    projectDropdown.shouldContain('openshift-monitoring');
    cy.log(
      'Nav back to list page from details page via sidebar nav menu should change Project back to "All Projects"',
    );
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    listPage.rows.shouldBeLoaded();
    projectDropdown.shouldContain(allProjectsDropdownLabel);
    cy.log(
      'Nav back to list page from details page via breadcrumb should change Project back to "All Projects"',
    );
    listPage.filter.byName('alertmanager-main');
    listPage.rows.clickRowByName('alertmanager-main');
    detailsPage.isLoaded();
    projectDropdown.shouldContain('openshift-monitoring');
    detailsPage
      .breadcrumb(0)
      .contains('Secrets')
      .click();
    listPage.rows.shouldBeLoaded();
    projectDropdown.shouldContain(allProjectsDropdownLabel);
  });

  it('nav and breadcrumbs restores last selected Project when navigating from details to list view', () => {
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.selectProject(defaultProjectName);
    projectDropdown.shouldContain(defaultProjectName);
    listPage.rows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    projectDropdown.shouldContain(defaultProjectName);
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.shouldContain(defaultProjectName);
    listPage.rows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    projectDropdown.shouldContain(defaultProjectName);
    detailsPage
      .breadcrumb(0)
      .contains('Secrets')
      .click();
    listPage.rows.shouldBeLoaded();
    projectDropdown.shouldContain(defaultProjectName);
  });

  ['Roles', 'RoleBindings'].forEach((rolesOrBindings) => {
    it.only(`tests ${rolesOrBindings} and Cluster${rolesOrBindings} detail page breadcrumbs`, () => {
      nav.sidenav.clickNavLink(['User Management', rolesOrBindings]);

      cy.log(`test Cluster${rolesOrBindings} & All Projects`);
      projectDropdown.selectProject(allProjectsDropdownLabel);
      listPage.rows.shouldBeLoaded();
      listPage.filter.by('cluster');
      listPage.filter.numberOfActiveFiltersShouldBe(1);
      listPage.filter.byName('alertmanager-main');
      listPage.rows.clickRowByName('alertmanager-main');
      detailsPage.isLoaded();
      projectDropdown.shouldNotExist();
      detailsPage
        .breadcrumb(0)
        .contains(rolesOrBindings)
        .click();
      listPage.rows.shouldBeLoaded();
      projectDropdown.shouldContain(allProjectsDropdownLabel);
      listPage.titleShouldHaveText(rolesOrBindings);

      cy.log(`test Cluster${rolesOrBindings} & default project`);
      projectDropdown.selectProject(defaultProjectName);
      projectDropdown.shouldContain(defaultProjectName);
      listPage.filter.by('cluster');
      listPage.filter.byName('alertmanager-main');
      listPage.rows.clickRowByName('alertmanager-main');
      detailsPage.isLoaded();
      projectDropdown.shouldNotExist();
      detailsPage
        .breadcrumb(0)
        .contains(rolesOrBindings)
        .click();
      listPage.rows.shouldBeLoaded();
      projectDropdown.shouldContain(defaultProjectName);
      listPage.titleShouldHaveText(rolesOrBindings);

      cy.log(`test ${rolesOrBindings} & default project`);
      listPage.filter.by('namespace');
      listPage.filter.byName('prometheus-k8s');
      listPage.rows.clickRowByName('prometheus-k8s');
      detailsPage.isLoaded();
      projectDropdown.shouldContain(defaultProjectName);
      detailsPage
        .breadcrumb(0)
        .contains(rolesOrBindings)
        .click();
      listPage.rows.shouldBeLoaded();
      projectDropdown.shouldContain(defaultProjectName);

      cy.log(`test ${rolesOrBindings} & All Projects`);
      projectDropdown.selectProject(allProjectsDropdownLabel);
      listPage.rows.shouldBeLoaded();
      listPage.filter.by('namespace');
      const resource = rolesOrBindings === 'Roles' ? 'example' : 'network-diagnostics';
      listPage.filter.byName(resource);
      listPage.rows.clickRowByName(resource);
      detailsPage.isLoaded();
      projectDropdown.shouldContain(rolesOrBindings === 'Roles' ? testName : 'kube-system');
      detailsPage
        .breadcrumb(0)
        .contains(rolesOrBindings)
        .click();
      listPage.rows.shouldBeLoaded();
      projectDropdown.shouldContain(allProjectsDropdownLabel);
    });
  });
});
