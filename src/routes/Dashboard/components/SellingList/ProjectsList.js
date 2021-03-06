import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import {
  useFirebase,
  useFirebaseConnect,
  isLoaded,
  isEmpty
} from 'react-redux-firebase'
import { useNotifications } from 'modules/notification'
import LoadingSpinner from 'components/LoadingSpinner'
import SellingPostTile from '../SellingPostTile'
import NewProjectTile from '../NewProjectTile'
import NewProjectDialog from '../NewProjectDialog'
import styles from './ProjectsList.styles'
import { createSelector } from 'reselect'


const useStyles = makeStyles(styles)

function useProjectsList() {
  const { showSuccess, showError } = useNotifications()
  const firebase = useFirebase()

  // Get auth from redux state
  const auth = useSelector(state => state.firebase.auth)
  // Create listeners based on current users UID
  
  useFirebaseConnect([
    {
      path: 'books',
      queryParams: [
//        'orderByChild=createdBy',
//        `equalTo=${auth.uid}`,
        'limitToLast=10'
      ]
    }
  ])
  
  // Get projects from redux state
  const projects = useSelector(state => state.firebase.ordered.books)

  // New dialog
  const [newDialogOpen, changeDialogState] = useState(false)
  const toggleDialog = () => changeDialogState(!newDialogOpen)

  function addProject(newInstance) {
    if (!auth.uid) {
      return showError('You must be logged in to create a project')
    }
    return firebase
      .push('projects', {
        ...newInstance,
        createdBy: auth.uid,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      })
      .then(() => {
        toggleDialog()
        showSuccess('Project added successfully')
      })
      .catch(err => {
        console.error('Error:', err) // eslint-disable-line no-console
        showError(err.message || 'Could not add project')
        return Promise.reject(err)
      })
  }

  return { projects, addProject, newDialogOpen, toggleDialog, auth }
}

function ProjectsList() {
  const classes = useStyles()
  const {
    projects,
    addProject,
    newDialogOpen,
    toggleDialog,
    auth
  } = useProjectsList()

  // Show spinner while projects are loading
  if (!isLoaded(projects)) {
    return <LoadingSpinner />
  }

  return (
    <div className={classes.root}>
      <NewProjectDialog
        onSubmit={addProject}
        open={newDialogOpen}
        onRequestClose={toggleDialog}
      />
      <div className={classes.tiles}>
        {!isEmpty(projects) &&
          projects.filter(p => p && p.value.createdBy == auth.uid).map((project, ind) => {
            return (
              <SellingPostTile
                key={`Project-${project.key}-${ind}`}
                name={project && project.value.title}
                title={project && project.value.title}
                isbn={project && project.value.isbn}
                status={project && project.value.status}
                delivery_status={project && project.value.delivery_status}
                buyer_id={project && project.value.buyer_id}
                price={project && project.value.price}
                projectId={project.key}
              />
            )
          })}
        <NewProjectTile onClick={toggleDialog} />
      </div>
    </div>
  )
}

export default ProjectsList
