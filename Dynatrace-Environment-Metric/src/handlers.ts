import {ResourceModel, TypeConfigurationModel} from './models';
import {DynatraceClient} from '../../Dynatrace-Common/src/dynatrace-client';
import {AbstractDynatraceResource} from '../../Dynatrace-Common/src/abstract-dynatrace-resource';
import {CaseTransformer, Transformer} from '../../Dynatrace-Common/src/util';

import {version} from "../package.json";

type MetricPayload = {
    dimensions: any
};

class Resource extends AbstractDynatraceResource<ResourceModel, MetricPayload, MetricPayload, MetricPayload, TypeConfigurationModel> {

    private userAgent = `AWS CloudFormation (+https://aws.amazon.com/cloudformation/) CloudFormation resource ${this.typeName}/${version}`;

    async get(model: ResourceModel, typeConfiguration?: TypeConfigurationModel): Promise<MetricPayload> {
        const response = await new DynatraceClient(typeConfiguration?.dynatraceAccess.endpoint, typeConfiguration?.dynatraceAccess.token, this.userAgent).doRequest<MetricPayload>(
            'get',
            `/api/v1/timeseries/${model.id}`);
        return response.data;
    }

    async list(model: ResourceModel, typeConfiguration?: TypeConfigurationModel): Promise<ResourceModel[]> {
        const response = await new DynatraceClient(typeConfiguration?.dynatraceAccess.endpoint, typeConfiguration?.dynatraceAccess.token, this.userAgent).doRequest<MetricPayload[]>(
            'get',
            `/api/v1/timeseries`,
            {source: 'CUSTOM'});

        return response.data.map(metric => this.setModelFrom(new ResourceModel(model), metric));
    }

    async create(model: ResourceModel, typeConfiguration?: TypeConfigurationModel): Promise<MetricPayload> {
        const response = await new DynatraceClient(typeConfiguration?.dynatraceAccess.endpoint, typeConfiguration?.dynatraceAccess.token, this.userAgent).doRequest<MetricPayload>(
            'put',
            `/api/v1/timeseries/${model.id}`,
            {},
            Transformer.for(model.toJSON())
                .transformKeys(CaseTransformer.PASCAL_TO_CAMEL)
                .transform());
        return response.data;
    }

    async update(model: ResourceModel, typeConfiguration?: TypeConfigurationModel): Promise<MetricPayload> {
        return this.create(model);
    }

    async delete(model: ResourceModel, typeConfiguration?: TypeConfigurationModel): Promise<void> {
        await new DynatraceClient(typeConfiguration?.dynatraceAccess.endpoint, typeConfiguration?.dynatraceAccess.token, this.userAgent).doRequest(
            'delete',
            `/api/v1/timeseries/${model.id}`);
    }

    newModel(partial?: any): ResourceModel {
        return new ResourceModel(partial);
    }

    setModelFrom(model: ResourceModel, from?: MetricPayload): ResourceModel {
        if (!from) {
            return model;
        }

        let resourceModel = new ResourceModel({
            ...model,
            ...from
        });
        delete resourceModel.dimensions;

        return resourceModel;
    }

}

export const resource = new Resource(ResourceModel.TYPE_NAME, ResourceModel, null, null, TypeConfigurationModel);

// Entrypoint for production usage after registered in CloudFormation
export const entrypoint = resource.entrypoint;

// Entrypoint used for local testing
export const testEntrypoint = resource.testEntrypoint;
