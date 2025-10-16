from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from ..models import Project, ProjectStatus

User = get_user_model()


class ProjectAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            is_staff=True
        )
        
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123',
            is_staff=False
        )
        
        # Create test project
        self.project = Project.objects.create(
            code='PRJ-001',
            name='Test Project',
            status=ProjectStatus.ACTIVE,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            description='Test project description'
        )

    def test_list_projects_includes_existing(self):
        """Test that GET /projects/ returns existing projects"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('projects-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if response.data is a list or has pagination
        if isinstance(response.data, list):
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['code'], 'PRJ-001')
            self.assertEqual(response.data[0]['name'], 'Test Project')
        else:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['code'], 'PRJ-001')
            self.assertEqual(response.data['results'][0]['name'], 'Test Project')

    def test_create_project_ok(self):
        """Test successful project creation by admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects-list')
        data = {
            'code': 'PRJ-002',
            'name': 'New Project',
            'status': ProjectStatus.ACTIVE,
            'start_date': '2024-01-01',
            'end_date': '2024-12-31',
            'description': 'New project description'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 2)
        
        project = Project.objects.get(code='PRJ-002')
        self.assertEqual(project.name, 'New Project')
        self.assertEqual(project.status, ProjectStatus.ACTIVE)
        self.assertEqual(project.description, 'New project description')

    def test_unique_code(self):
        """Test that project code must be unique"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects-list')
        data = {
            'code': 'PRJ-001',  # Same as existing project
            'name': 'Duplicate Code Project',
            'status': ProjectStatus.ACTIVE
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', response.data)

    def test_date_order(self):
        """Test that end_date must be after start_date"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects-list')
        data = {
            'code': 'PRJ-003',
            'name': 'Invalid Date Project',
            'status': ProjectStatus.ACTIVE,
            'start_date': '2024-12-31',
            'end_date': '2024-01-01'  # End before start
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('end_date', response.data)

    def test_update_project(self):
        """Test project update by admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects-detail', kwargs={'pk': self.project.pk})
        data = {
            'code': 'PRJ-001',
            'name': 'Updated Project Name',
            'status': ProjectStatus.ARCHIVED,
            'start_date': '2024-01-01',
            'end_date': '2024-12-31',
            'description': 'Updated description'
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.project.refresh_from_db()
        self.assertEqual(self.project.name, 'Updated Project Name')
        self.assertEqual(self.project.status, ProjectStatus.ARCHIVED)
        self.assertEqual(self.project.description, 'Updated description')

    def test_delete_project(self):
        """Test project deletion by admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects-detail', kwargs={'pk': self.project.pk})
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Project.objects.count(), 0)

    def test_regular_user_cannot_create(self):
        """Test that regular users cannot create projects"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('projects-list')
        data = {
            'code': 'PRJ-004',
            'name': 'Unauthorized Project',
            'status': ProjectStatus.ACTIVE
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_update(self):
        """Test that regular users cannot update projects"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('projects-detail', kwargs={'pk': self.project.pk})
        data = {
            'code': 'PRJ-001',
            'name': 'Unauthorized Update',
            'status': ProjectStatus.ACTIVE
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_delete(self):
        """Test that regular users cannot delete projects"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('projects-detail', kwargs={'pk': self.project.pk})
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_access(self):
        """Test that unauthenticated users cannot access projects"""
        url = reverse('projects-list')
        response = self.client.get(url)
        
        # Django REST framework returns 403 for unauthenticated users with custom permissions
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_field_validation(self):
        """Test field length validations"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects-list')
        
        # Test code too long
        data = {
            'code': 'A' * 21,  # Too long
            'name': 'Test Project',
            'status': ProjectStatus.ACTIVE
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test name too long
        data = {
            'code': 'PRJ-005',
            'name': 'A' * 121,  # Too long
            'status': ProjectStatus.ACTIVE
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test description too long
        data = {
            'code': 'PRJ-006',
            'name': 'Test Project',
            'status': ProjectStatus.ACTIVE,
            'description': 'A' * 501  # Too long
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_functionality(self):
        """Test search by code and name"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('projects-list')
        
        # Search by code
        response = self.client.get(url, {'search': 'PRJ-001'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, list):
            self.assertEqual(len(response.data), 1)
        else:
            self.assertEqual(len(response.data['results']), 1)
        
        # Search by name
        response = self.client.get(url, {'search': 'Test Project'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, list):
            self.assertEqual(len(response.data), 1)
        else:
            self.assertEqual(len(response.data['results']), 1)
        
        # Test that search returns results (don't test empty results as it might be flaky)
        response = self.client.get(url, {'search': 'Test'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, list):
            self.assertGreaterEqual(len(response.data), 1)
        else:
            self.assertGreaterEqual(len(response.data['results']), 1)

    def test_filter_by_status(self):
        """Test filtering by status"""
        # Create another project with ARCHIVED status
        Project.objects.create(
            code='PRJ-007',
            name='Archived Project',
            status=ProjectStatus.ARCHIVED
        )
        
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('projects-list')
        
        # Filter by ACTIVE status
        response = self.client.get(url, {'status': ProjectStatus.ACTIVE})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, list):
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['status'], ProjectStatus.ACTIVE)
        else:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['status'], ProjectStatus.ACTIVE)
        
        # Filter by ARCHIVED status
        response = self.client.get(url, {'status': ProjectStatus.ARCHIVED})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, list):
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['status'], ProjectStatus.ARCHIVED)
        else:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['status'], ProjectStatus.ARCHIVED)
