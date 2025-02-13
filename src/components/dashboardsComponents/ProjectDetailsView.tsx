import React, { useState, useEffect, memo } from 'react';
import {
  X, Users, Calendar, BarChart2, UserCircle, Tag,
  Edit, Save, Trash2, Clock, CheckCircle2, Archive, Eye
} from 'lucide-react';
import TeamDetailsPopup from '../popups/TeamDetailPopup';
import { useAppSelector } from '../../redux/store';
import { Project, Team, User } from '../../types';
import teamServices from '../../api/services/teamServices';
import projectServices from '../../api/services/projectServices';
import { toast } from 'react-hot-toast';
import userServices from '../../api/services/userServices';

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
}

const ProjectDetailsView: React.FC<ProjectDetailsProps> = memo(({ project, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projectTeams, setProjectTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [editedProject, setEditedProject] = useState<Partial<Project>>({
    name: project.name,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    status: project.status,
    projectManagerId: project.projectManagerId,
    teams: project.teams
  });

  const userCurr = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const getUsers = async () => {
      const res = await userServices.getAllUsers();
      if (res) {
        setAllUsers(res);
      }
    }

    getUsers();
  }, [])

  useEffect(() => {
    fetchProjectData();
  }, [project.projectId]);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const [projectTeamsData] = await Promise.all([
        teamServices.getProjectTeams(project.projectId)
      ]);
      setProjectTeams(projectTeamsData);
    } catch (error) {
      toast.error('Error fetching project data');
      console.error('Error fetching project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
  };

  const closeModal = () => {
    setSelectedTeam(null);
  };

  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Not specified';

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'planning': return <Clock className="mr-2 text-yellow-600" size={20} />;
      case 'active': return <CheckCircle2 className="mr-2 text-green-600" size={20} />;
      case 'archived': return <Archive className="mr-2 text-gray-600" size={20} />;
      default: return <BarChart2 className="mr-2 text-gray-600" size={20} />;
    }
  };

  const handleSave = async () => {
    try {
      await projectServices.updateProject(project.projectId, editedProject);
      await fetchProjectData();
      setIsEditing(false);
    } catch (error) {
      toast.error('Error updating project');
      console.error('Error updating project:', error);
    }
  };

  const handleRemoveTeam = async (teamId: number) => {
    try {
      await projectServices.removeTeamFromProject(project.projectId, teamId);
      await fetchProjectData();
      toast.success('Team removed successfully');
    } catch (error) {
      toast.error('Error removing team');
      console.error('Error removing team:', error);
    }
  };

  const editableFields = [
    {
      key: 'startDate' as keyof Project,
      icon: <Calendar className="mr-3 text-blue-600" size={20} />,
      label: 'Start Date',
      type: 'date',
      renderValue: (value: string | undefined) => formatDate(value)
    },
    {
      key: 'endDate' as keyof Project,
      icon: <Calendar className="mr-3 text-red-600" size={20} />,
      label: 'Deadline',
      type: 'date',
      renderValue: (value: string | undefined) => formatDate(value)
    },
    {
      key: 'status' as keyof Project,
      icon: getStatusIcon(editedProject.status),
      label: 'Status',
      type: 'select',
      options: ['planning', 'active', 'archived'],
      renderValue: (value: string | undefined) => value ?? 'N/A'
    },
    {
      key: 'projectManagerId' as keyof Project,
      icon: <UserCircle className="mr-3 text-purple-600" size={20} />,
      label: 'Project Manager',
      type: 'number',
      renderValue: (value: number | undefined) => value?.toString() ?? 'N/A'
    }
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg">
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}>
      <div className="w-full max-w-5xl h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-2/5 bg-gray-50 p-8 border-r border-gray-200 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Project Information
            </h3>
            {(userCurr?.role === "Admin" || (userCurr?.role === "Organisation" && project.projectId === userCurr.id)) && (
              !isEditing ? (
                <button onClick={() => setIsEditing(true)}
                  className="text-gray-600 hover:text-gray-900 transition-colors rounded-full p-2 hover:bg-gray-200">
                  <Edit size={20} />
                </button>
              ) : (
                <button onClick={() => setIsEditing(false)}
                  className="text-red-600 hover:text-red-900 transition-colors rounded-full p-2 hover:bg-red-100">
                  <X size={20} />
                </button>
              )
            )}
          </div>

          <div className="space-y-2">
            <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <Tag className="mr-3 text-indigo-600" size={20} />
                <span className="text-gray-600 text-sm">Project ID</span>
              </div>
              <p className="text-gray-800 font-medium ml-9">
                {project.projectId}
              </p>
            </div>

            {editableFields.map(({ key, icon, label, type, options, renderValue }) => (
              <div key={key} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  {icon}
                  <span className="text-gray-600 text-sm">{label}</span>
                </div>
                {isEditing ? (
                  type === 'select' ? (
                    <select
                      value={editedProject[key] as string || ''}
                      onChange={(e) => setEditedProject({
                        ...editedProject,
                        [key]: e.target.value
                      })}
                      className="w-full p-1 border rounded focus:ring-2 focus:ring-blue-200"
                    >
                      {options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={editedProject[key] as string || ''}
                      onChange={(e) => setEditedProject({
                        ...editedProject,
                        [key]: e.target.value
                      })}
                      className="w-full p-1 border rounded focus:ring-2 focus:ring-blue-200"
                    />
                  )
                ) : (
                  <p className={`text-gray-800 font-medium ml-9 capitalize 
                    ${key === 'status' ? getStatusColor(editedProject[key] as string) : ''} 
                    rounded-md px-2 py-1 inline-block`}>
                    {renderValue(editedProject[key] as any)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="w-3/5 p-4 overflow-y-auto flex flex-col justify-between items-center">
          <div className="space-y-4 w-full">
            <div className="flex flex-col items-start justify-start p-2 mt-2 w-full gap-2">
              <div className='flex items-center justify-between p-2 w-full'>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProject.name || ''}
                    onChange={(e) => setEditedProject({
                      ...editedProject,
                      name: e.target.value
                    })}
                    className="text-2xl font-medium text-gray-900 w-full p-2 border rounded focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <h2 className="text-2xl font-medium text-gray-900 flex items-center">
                    {project.name}
                  </h2>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-600 hover:text-gray-900 transition-colors rounded-full p-2 hover:bg-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-gray-100 p-6 rounded-xl w-full hover:bg-gray-50 transition-colors">
                {isEditing ? (
                  <textarea
                    value={editedProject.description || ''}
                    onChange={(e) => setEditedProject({
                      ...editedProject,
                      description: e.target.value
                    })}
                    className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter project description"
                  />
                ) : (
                  <p className="text-gray-600 text-sm">
                    {project.description || 'No description provided'}
                  </p>
                )}
              </div>
            </div>

            <div className='p-4'>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                  <Users className="mr-2 text-black" size={20} />
                  Assigned Teams ({projectTeams.length})
                </h3>
              </div>

              {projectTeams.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {projectTeams.map((team) => (
                    <div
                      key={team.teamId}
                      className="bg-gray-100 p-3 rounded-lg shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <UserCircle className="mr-3 text-blue-600" size={20} />
                        <span className="text-gray-800 font-medium">
                          {team.name} {" "} [Id: {team.teamId}]
                        </span>
                      </div>
                      <div className='flex gap-2 items-center justify-center'>
                        <Eye
                          className='text-blue-600 hover:text-gray-700 cursor-pointer'
                          onClick={() => handleTeamClick(team)}
                        />
                        {isEditing && (
                          <Trash2
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                            onClick={() => handleRemoveTeam(team.teamId)}
                            size={20}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-3 rounded-lg shadow-sm">
                  No teams assigned
                </p>
              )}
            </div>
          </div>

          {selectedTeam && (
            <TeamDetailsPopup
              team={selectedTeam}
              users={allUsers}
              onClose={closeModal}
            />
          )}

          {isEditing && (
            <div className='w-full flex justify-end p-4 gap-2'>
              <button
                onClick={() => setIsEditing(false)}
                className="text-white flex items-center justify-center gap-2 hover:bg-red-400 transition-colors rounded-full px-3 py-1 bg-red-600"
              >
                <X size={20} /> Discard
              </button>
              <button
                onClick={handleSave}
                className="text-white flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors rounded-full px-3 py-1 bg-black"
              >
                <Save size={20} /> Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProjectDetailsView.displayName = "ProjectDetailsView";
export default ProjectDetailsView;