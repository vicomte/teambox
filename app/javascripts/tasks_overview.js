// For Projects#index: Load task in main view with AJAX
document.on('click', '.my_tasks_listing .task a', function(e, el) {
  if (e.isMiddleClick()) return
  e.stop()

  var task = el.up('.task')

  task.down('.left_arrow_icon').hide()
  task.down('.loading_icon').show()
  
  new Ajax.Request(task.down('a.name').readAttribute('href')+".frag", {
    method: "get",
    onSuccess: function(r) {
      $('content').update(r.responseText)
      format_posted_date()
      Task.insertAssignableUsers()
      addHashForAjaxLink(el.readAttribute('href'))
      $('back_to_overview').show()
    },
    onComplete: function() {
      task.down('.left_arrow_icon').show()
      task.down('.loading_icon').hide()
    }
  })

})

// Remove task from sidebar if it's not assigned to me anymore
document.on('ajax:success', ".thread[data-class='task'] form", function(e, form) {
  var status = form.down("select[name='task[status]']").getValue()
  var person = form.down("select[name='task[assigned_id]']").getValue()

  // my_projects contains a list of my Person models, we look them up to see if it's me
  var is_assigned_to_me = (status == 1) && my_projects[person]
  var task = $('my_tasks_'+form.up('.thread').readAttribute('data-id'))

  if(task) {
    is_assigned_to_me ? task.show() : task.hide()
  }
})

// Load activities on main view using AJAX
document.on('click', '#back_to_overview', function(e, el) {
  if (e.isMiddleClick()) return
  e.stop()

  $('content').update("<div class='loading_icon'> </div>")

  new Ajax.Request(el.readAttribute('href')+".frag", {
    method: "get",
    onSuccess: function(r) {
      $('content').update(r.responseText)
      format_posted_date()
      addHashForAjaxLink(el.readAttribute('href'))
      $('back_to_overview').hide()
    }
  })
})

// TODO: If i assign something to myself, it should be added to my task list


// New task from overview
var toggleTaskFromIndex = function() {
	$('new_task_from_overview').toggle()
	$('new_task_link').toggle()
	$('new_conversation').toggle()
}

var populateProjectSelect = function() {
	var projectSelect = $('task_project_id')
	projectSelect.update()

	$H(my_organizations).each( function(organization) {
		var organizationId = organization[0]
		var optionsGroup = new Element('optgroup', {'label': organization[1].name})

		var projects = $H(my_projects).select( function(project) { 
			return(project[1].role >= 2 && project[1].organizationId == organizationId) 
			}).collect( function(project) { 
						p = $H(project[1])
						p.set('projectId', project[0])
						return p
					})

	 	projects.each(function(project) {
	 		var option = new Element('option', {'value': project.get('projectId')}).update(project.get('name'))
			if (project.get('projectId') == current_project) option.selected = true
	 		optionsGroup.insert( option )
	 	})

		projectSelect.insert( optionsGroup  )
	})
}

var updateTaskListSelect = function() {
	var taskListSelect = $('task_task_list_id')
	var projectId = $F('task_project_id')

	new Ajax.Request('/api/1/projects/' + projectId + '/task_lists.json', {
    method:'get',
    requestHeaders: {Accept: 'application/json'},
    onSuccess: function(transport) {
      	var json = transport.responseText.evalJSON(true)
      	taskListSelect.options.length = 0
				taskListSelect.disabled = true

				json.objects.each(function(taskList) {
	    		taskListSelect.options.add(new Option(taskList.name, taskList.id))
				})

				if (taskListSelect.options.length > 0) taskListSelect.disabled = false
    },
    onFailure: function() { taskListSelect.disabled = true }
  })

}

document.on('click', '#new_task_link', function(e) {
	e.stop()
	toggleTaskFromIndex()
  populateProjectSelect()
	updateTaskListSelect()
})

document.on('change', '#task_project_id', function(e) {
	updateTaskListSelect()
})

document.on('click', '#cancel_task_from_overview', function(e) {
	e.stop()
	toggleTaskFromIndex()
})
