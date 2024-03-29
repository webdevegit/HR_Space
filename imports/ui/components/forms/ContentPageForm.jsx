import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Col, Form, FormControl, ControlLabel, FormGroup, Checkbox, Radio } from 'react-bootstrap';

import FieldGroup from '../FieldGroup';
import SmartCustomSelect from '../SmartCustomSelect';
import CustomSwitch from '../CustomSwitch';
import CustomEditor from '../CustomEditor';

import { ImagesStore } from '../../../api/collections/images';
import { Roles } from 'meteor/alanning:roles';
const propTypes = {
    businesses: PropTypes.arrayOf(PropTypes.object).isRequired,
    contentPage: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    error: PropTypes.object
};

class ContentPageForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            images: [],
            error: null,
            ...props.contentPage,
        };
    }

    handleChange = event => {
        this.setState({ [event.target.id]: event.target.value });
    }

    handleSwitchToggle = event => {
        this.setState({ [event.target.id]: !this.state[event.target.id] });
    }

    handleRadioChange = event => {
        this.setState({ visibleFor: event.target.name });
    }

    handleOnSelect = (value, stateProp) => {
        this.setState({ [stateProp]: value });
    }

    handleSubmit = event => {
        event.preventDefault();

        const { images, error: err, ...contentPage } = this.state;
        
        const imagesToDelete = images.filter(image => !~this.state.detail.indexOf(image.url)).map(image => image._id);

        if (imagesToDelete.length > 0) {
            Meteor.call('images.remove', imagesToDelete, (error, response) => {
                if (error) {
                    setTimeout(() => this.setState({ error: null }), 3000);
    
                    this.setState({ error: error.reason });
                } else {
                    this.props.onSubmit(contentPage);
                }
            });
        } else {
            this.props.onSubmit(contentPage);
        }
    }

    handleCancel = event => {
        event.preventDefault();

        const imagesToDelete = this.state.images.map(image => image._id);

        if (imagesToDelete.length > 0) {
            Meteor.call('images.remove', imagesToDelete, (error, response) => {
                if (error) {
                    setTimeout(() => this.setState({ error: null }), 3000);
    
                    this.setState({ error: error.reason });
                } else {
                    this.props.onClose();
                }
            });
        } else {
            this.props.onClose();
        }
    }

    handleEditorChange = html => {
        this.setState({ article: html });
    }

    uploadImageCallback = file => {
        return new Promise((resolve, reject) => {
            const image = {
                name: file.name,
                type: file.type,
                size: file.size,
            };

            const uploader = new UploadFS.Uploader({
                data: file,
                file: image,
                store: ImagesStore,
                onError: error => {
                    setTimeout(() => this.setState({ error: null }), 3000);

                    this.setState({ error: error.reason });

                    reject(error.reason);
                },
                onComplete: f => {
                    this.setState({ images: this.state.images.concat([f]) });

                    resolve({ data: { link: f.url } });
                }
            });

            uploader.start();
        });
    }

    render() {
        return (
            <Col sm={10} style={{ marginTop: '20px' }}>
                <Form horizontal onSubmit={this.handleSubmit}>
                {
                    Roles.userIsInRole(Meteor.userId(), 'super_admin') //говнокод
                    &&
                    <FormGroup bsSize='lg' controlId='business'>
                        <Col componentClass={ControlLabel} sm={3}>Business Name</Col>
                        <Col sm={5}>
                            <SmartCustomSelect 
                                id='business'
                                option={this.state.business}
                                options={this.props.businesses} 
                                onSelect={value => this.handleOnSelect(value, 'business')}
                                help={this.props.error && this.props.error.field === 'business' ?  this.props.error.message : ''}
                            />
                        </Col>
                    </FormGroup>
                }
                    <FieldGroup
                        id='name'
                        type='text'
                        label='Article name'
                        value={this.state.name}
                        onChange={this.handleChange}
                        inputsize={6}
                        help={this.props.error && this.props.error.field === 'name' ?  this.props.error.message : ''}
                    />
                    <FieldGroup
                        id='summary'
                        type='text'
                        label='Article summary'
                        value={this.state.summary}
                        onChange={this.handleChange}
                        inputsize={6}
                        help={this.props.error && this.props.error.field === 'summary' ?  this.props.error.message : ''}
                    />
                    <FormGroup bsSize='lg' controlId='article'>
                        <Col componentClass={ControlLabel} sm={3}>Full policy details</Col>
                        <Col sm={9}>
                            <CustomEditor 
                                html={this.state.article} 
                                onImageUpload={this.uploadImageCallback}
                                onChange={this.handleEditorChange}
                            />
                        </Col>
                    </FormGroup>
                    <FormGroup bsSize='lg' controlId='isActive'>
                        <Col componentClass={ControlLabel} sm={3}>Active</Col>
                        <Col sm={6}>
                            <CustomSwitch 
                                id='isActive' 
                                checked={this.state.isActive} 
                                onChange={this.handleSwitchToggle}
                            />
                        </Col>
                    </FormGroup>
                    <FormGroup bsSize='lg' controlId='visibleFor'>
                        <Col componentClass={ControlLabel} sm={3}>Visible for</Col>
                        <Col sm={6}>
                            <Radio checked={this.state.visibleFor === 'all'} onChange={this.handleRadioChange} name='all' inline>All</Radio>
                            <Radio checked={this.state.visibleFor === 'hr'} onChange={this.handleRadioChange} name='hr' inline>HR</Radio>
                            <Radio checked={this.state.visibleFor === 'manager'} onChange={this.handleRadioChange} name='manager' inline>Manager</Radio>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col smOffset={3} sm={3}>
                            <Button bsClass='button-primary' type='submit'>Save</Button>
                        </Col>
                        <Col sm={3}>
                            <Button onClick={this.handleCancel} bsClass='button-secondary'>Cancel</Button>
                        </Col>
                    </FormGroup>
                </Form>
            </Col>
        );
    }
}

export default ContentPageForm;