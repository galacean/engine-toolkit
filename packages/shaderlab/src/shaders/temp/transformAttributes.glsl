temp_attributes.POSITION = attr.POSITION;

	#ifdef RENDERER_HAS_BLENDSHAPE
    	#ifndef RENDERER_BLENDSHAPE_USE_TEXTURE
    		temp_attributes.POSITION_BS0 = attr.POSITION_BS0;
    	  	temp_attributes.POSITION_BS1 = attr.POSITION_BS1;
    	  	#if defined( RENDERER_BLENDSHAPE_HAS_NORMAL ) && defined( RENDERER_BLENDSHAPE_HAS_TANGENT )
    	    	temp_attributes.NORMAL_BS0 = attr.NORMAL_BS0;
    	    	temp_attributes.NORMAL_BS1 = attr.NORMAL_BS1;
    	    	temp_attributes.TANGENT_BS0 = attr.TANGENT_BS0;
    	    	temp_attributes.TANGENT_BS1 = attr.TANGENT_BS1;
    	  	#else
    	    	#if defined( RENDERER_BLENDSHAPE_HAS_NORMAL ) || defined( RENDERER_BLENDSHAPE_HAS_TANGENT )
    	    	  temp_attributes.POSITION_BS2 = attr.POSITION_BS2;
    	    	  temp_attributes.POSITION_BS3 = attr.POSITION_BS3;

    	    	  #ifdef RENDERER_BLENDSHAPE_HAS_NORMAL
    	    	    temp_attributes.NORMAL_BS0 = attr.NORMAL_BS0;
    	    	    temp_attributes.NORMAL_BS1 = attr.NORMAL_BS1;
    	    	    temp_attributes.NORMAL_BS2 = attr.NORMAL_BS2;
    	    	    temp_attributes.NORMAL_BS3 = attr.NORMAL_BS3;
    	    	  #endif

    	    	  #ifdef RENDERER_BLENDSHAPE_HAS_TANGENT
    	    	    temp_attributes.TANGENT_BS0 = attr.TANGENT_BS0;
    	    	    temp_attributes.TANGENT_BS1 = attr.TANGENT_BS1;
    	    	    temp_attributes.TANGENT_BS2 = attr.TANGENT_BS2;
    	    	    temp_attributes.TANGENT_BS3 = attr.TANGENT_BS3;
    	    	  #endif

    	    	#else
    	    	  temp_attributes.POSITION_BS2 = attr.POSITION_BS2;
    	    	  temp_attributes.POSITION_BS3 = attr.POSITION_BS3;
    	    	  temp_attributes.POSITION_BS4 = attr.POSITION_BS4;
    	    	  temp_attributes.POSITION_BS5 = attr.POSITION_BS5;
    	    	  temp_attributes.POSITION_BS6 = attr.POSITION_BS6;
    	    	  temp_attributes.POSITION_BS7 = attr.POSITION_BS7;
    	    #endif
    	#endif
    #endif
  #endif


  #ifdef RENDERER_HAS_UV
      temp_attributes.TEXCOORD_0 = attr.TEXCOORD_0;
  #endif

  #ifdef RENDERER_HAS_UV1
      temp_attributes.TEXCOORD_1 = attr.TEXCOORD_1;
  #endif

  #ifdef RENDERER_HAS_SKIN
      temp_attributes.JOINTS_0 = attr.JOINTS_0;
      temp_attributes.WEIGHTS_0 = attr.WEIGHTS_0;
  #endif

  #ifdef RENDERER_ENABLE_VERTEXCOLOR
      temp_attributes.COLOR_0 = attr.COLOR_0;
  #endif

  #ifndef MATERIAL_OMIT_NORMAL
      #ifdef RENDERER_HAS_NORMAL
          temp_attributes.NORMAL = attr.NORMAL;
      #endif

      #ifdef RENDERER_HAS_TANGENT
          temp_attributes.TANGENT = attr.TANGENT;
      #endif
  #endif